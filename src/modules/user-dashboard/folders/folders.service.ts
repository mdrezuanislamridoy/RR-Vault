import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/lib/prisma/prisma.service";

@Injectable()
export class FoldersService {
    constructor(private readonly prisma: PrismaService) { }


}