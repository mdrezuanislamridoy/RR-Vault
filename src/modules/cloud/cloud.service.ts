import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { successResponse } from '@/common/response';

@Injectable()
export class CloudService {
  constructor(private readonly prisma: PrismaService) {}

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

    await this.prisma.client.cloudData.delete({ where: { id } });

    return successResponse('File deleted successfully');
  }
}
