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
        name: true,
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

    await this.prisma.client.subscribed.updateMany({
      where: { userId },
      data: {
        storageUsed: { decrement: file.fileSize || 0 }, // Adjust field name based on your schema (usually fileSize is saved)
        fileUploaded: { decrement: 1 }
      }
    });

    return successResponse('File deleted successfully');
  }

  async uploadFile(file: Express.Multer.File, userId: string, folder?: string) {
    const fileKey = `${folder ? folder + '/' : ''}${uuidv4()}-${file.originalname}`;
    const bucketName = process.env.BUCKET_NAME;

    try {

      const subscription = await this.prisma.client.subscribed.findFirst({
        where: { userId },
      });

      if (!subscription) {
        throw new BadRequestException('Subscription not found');
      }

      // Convert storageLimit from GB to Bytes (1 GB = 1073741824 Bytes)
      const storageLimitInBytes = subscription.storageLimit * 1024 * 1024 * 1024;

      if (subscription.storageUsed + file.size > storageLimitInBytes) {
        throw new BadRequestException('Storage limit exceeded');
      }

      if (subscription.fileUploaded + 1 > subscription.fileLimit) {
        throw new BadRequestException('File limit exceeded');
      }

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
          name: file.originalname,
          publicKey: fileKey,
          user: { connect: { id: userId } },
          ...(folder && {
            folder: {
              create: {
                folderName: folder,
                user: { connect: { id: userId } },
              },
            },
          }),
          fileSize: file.size,
          fileType: file.mimetype,
        },
        include: { folder: true }
      });

      // Update the user's subscription usage
      await this.prisma.client.subscribed.update({
        where: { id: subscription.id },
        data: {
          storageUsed: { increment: file.size },
          fileUploaded: { increment: 1 }
        }
      });

      return successResponse('File uploaded successfully', {
        id: savedFile.id,
        url: fileUrl,
        key: fileKey,
        size: file.size,
        name: file.originalname,
        folder: savedFile.folder,
      });
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }
}
