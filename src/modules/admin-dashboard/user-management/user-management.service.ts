import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { GetUsersDto } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma } from '@prisma';
import { successResponse } from '@/common/response';

@Injectable()
export class UserManagementService {
    constructor(private readonly prisma: PrismaService) { }

    async getUsers(query: GetUsersDto) {
        const { page = 1, limit = 10, search, role, isBlocked, isEmailVerified } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {
            isDeleted: false,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            where.role = role;
        }

        if (isBlocked !== undefined) {
            where.isBlocked = isBlocked;
        }

        if (isEmailVerified !== undefined) {
            where.isEmailVerified = isEmailVerified;
        }

        const [users, total] = await Promise.all([
            this.prisma.client.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isBlocked: true,
                    isEmailVerified: true,
                    profilePic: true,
                    accountType: true,
                    created_at: true,
                    updated_at: true,
                },
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.client.user.count({ where }),
        ]);

        return successResponse("Users fetched successfully", {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }

    async updateUser(userId: string, updateData: UpdateUserDto) {
        const user = await this.prisma.client.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.isDeleted) {
            throw new NotFoundException('User not found');
        }

        const updatedUser = await this.prisma.client.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isBlocked: true,
                isEmailVerified: true,
                profilePic: true,
                accountType: true,
                created_at: true,
                updated_at: true,
            },
        });

        return successResponse("User updated successfully", updatedUser);
    }

    async updateBlockStatus(userId: string) {
        const user = await this.prisma.client.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.isDeleted) {
            throw new NotFoundException('User not found');
        }

        const updatedUser = await this.prisma.client.user.update({
            where: { id: userId },
            data: { isBlocked: !user.isBlocked },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isBlocked: true,
            },
        });

        return successResponse("User block status updated successfully", updatedUser);
    }
}
