import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { successResponse } from '@/common/response';
import { R2Config } from '@/config/clouflare/r2.config';
import { v4 as uuidv4 } from 'uuid';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class CloudService {
  constructor(private readonly prisma: PrismaService) { }

  async getAllFiles(userId: string) {
    const files = await this.prisma.client.cloudData.findMany({
      where: { userId },
      select: {
        id: true,
        data: true,
        publicKey: true,
        uploaded_at: true,
        shortenUrl: { select: { shortenUrlCode: true } },
      },
      orderBy: { uploaded_at: 'desc' },
    });

    return successResponse('Files fetched successfully', files);
  }

  async getFile(id: string, userId: string) {
    const file = await this.prisma.client.cloudData.findFirst({
      where: { id, userId },
      include: { shortenUrl: { select: { shortenUrlCode: true } } },
    });

    if (!file) throw new NotFoundException('File not found');

    return successResponse('File fetched successfully', file);
  }

  async deleteFile(id: string, userId: string) {
    const file = await this.prisma.client.cloudData.findFirst({
      where: { id, userId },
    });

    if (!file) throw new NotFoundException('File not found');

    const bucketName = process.env.BUCKET_NAME;

    try {
      await R2Config.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: file.publicKey,
      }));
    } catch (error) {
      console.error('Failed to delete from R2:', error);
    }

    await this.prisma.client.cloudData.delete({ where: { id } });

    return successResponse('File deleted successfully');
  }

  async uploadFile(file: Express.Multer.File, userId: string, folder?: string) {
    const fileKey = `${folder ? folder + '/' : ''}${uuidv4()}-${file.originalname}`;
    const bucketName = process.env.BUCKET_NAME;

    try {
      if (!bucketName) {
        throw new BadRequestException('S3 bucket name is not configured');
      }

      await R2Config.send(new PutObjectCommand({
        Bucket: bucketName as string,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));

      const publicDomain = process.env.CLOUDFLARE_PUBLIC_DOMAIN || process.env.CLOUDFLARE_S3_CLIENT_ENDPOINT;
      const fileUrl = `${publicDomain}/${fileKey}`;

      const savedFile = await this.prisma.client.cloudData.create({
        data: {
          data: fileUrl,
          publicKey: fileKey,
          userId: userId,
        },
      });

      return successResponse('File uploaded successfully', {
        id: savedFile.id,
        url: fileUrl,
        key: fileKey,
        size: file.size,
        mimetype: file.mimetype,
        originalname: file.originalname,
      });
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }
}
