import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { successResponse } from '@/common/response';
import { R2Config } from '@/config/clouflare/r2.config';
import { v4 as uuidv4 } from 'uuid';
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Response } from 'express';
import { Readable } from 'stream';

@Injectable()
export class CloudService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllFiles(userId: string) {
    const files = await this.prisma.client.cloudData.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        data: true,
        publicKey: true,
        fileSize: true,
        fileType: true,
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
      await R2Config.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: file.publicKey,
        }),
      );
    } catch (error) {
      console.error('Failed to delete from R2:', error);
    }

    await this.prisma.client.cloudData.delete({ where: { id } });

    await this.prisma.client.subscribed.updateMany({
      where: { userId },
      data: {
        storageUsed: { decrement: file.fileSize || 0 }, // Adjust field name based on your schema (usually fileSize is saved)
        fileUploaded: { decrement: 1 },
      },
    });

    return successResponse('File deleted successfully');
  }

  async downloadFile(id: string, userId: string, res: Response) {
    const file = await this.prisma.client.cloudData.findFirst({
      where: { id, userId },
    });

    if (!file) throw new NotFoundException('File not found');

    const bucketName = process.env.BUCKET_NAME;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: file.publicKey,
    });

    const s3Response = await R2Config.send(command);

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.name as string)}"`,
    );
    res.setHeader('Content-Type', file.fileType || 'application/octet-stream');
    if (s3Response.ContentLength) {
      res.setHeader('Content-Length', s3Response.ContentLength);
    }

    (s3Response.Body as Readable).pipe(res);
  }

  async uploadFile(file: Express.Multer.File, userId: string, folder?: string) {
    const fileKey = `${folder ? folder + '/' : ''}${uuidv4()}-${file.originalname}`;
    const bucketName = process.env.BUCKET_NAME;

    try {
      const subscription = await this.prisma.client.subscribed.findFirst({
        where: { userId, isActive: true },
      });

      if (!subscription) {
        throw new BadRequestException(
          'No active subscription found. Please subscribe to a plan to upload files.',
        );
      }

      // storageLimit is stored in bytes (from PackagePricing.maxStorage)
      const storageLimit = subscription.storageLimit;
      const fileLimit = subscription.fileLimit;
      const storageUsed = subscription.storageUsed;
      const fileUploaded = subscription.fileUploaded;

      if (storageUsed + file.size > storageLimit) {
        throw new BadRequestException(
          'Storage limit exceeded. Please upgrade your plan.',
        );
      }

      if (fileUploaded + 1 > fileLimit) {
        throw new BadRequestException(
          'File limit exceeded. Please upgrade your plan.',
        );
      }

      if (!bucketName) {
        throw new BadRequestException('S3 bucket name is not configured');
      }

      await R2Config.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const publicDomain =
        process.env.CLOUDFLARE_PUBLIC_DOMAIN ||
        process.env.CLOUDFLARE_S3_CLIENT_ENDPOINT;
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
        include: { folder: true },
      });

      // Update subscription usage
      await this.prisma.client.subscribed.update({
        where: { id: subscription.id },
        data: {
          storageUsed: { increment: file.size },
          fileUploaded: { increment: 1 },
        },
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
      if (error instanceof BadRequestException) throw error;
      console.error('S3 Upload Error:', error);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }
}
