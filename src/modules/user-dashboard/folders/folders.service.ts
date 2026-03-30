import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/lib/prisma/prisma.service";

@Injectable()
export class FoldersService {
    constructor(private readonly prisma: PrismaService) { }

    async createFolder(userId: string, folderName: string, parentFolderId?: string) {
        return this.prisma.client.folder.create({
            data: {
                userId,
                folderName,
                parentFolderId,
            },
        });
    }

    async getFolders(userId: string, parentFolderId?: string) {
        return this.prisma.client.folder.findMany({
            where: {
                userId,
                parentFolderId,
            },
        });
    }

    async getFolderDataById(folderId: string) {
        return this.prisma.client.folder.findUnique({
            where: { id: folderId },
            include: {
                cloudData: true,
                childFolders: true,
            },
        });
    }

    async updateFolder(folderId: string, folderName: string) {
        return this.prisma.client.folder.update({
            where: { id: folderId },
            data: { folderName },
        });
    }

    async deleteFolder(folderId: string) {
        return this.prisma.client.folder.delete({
            where: { id: folderId },
        });
    }
}