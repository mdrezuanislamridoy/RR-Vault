import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { FoldersService } from "./folders.service";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRoles } from "@prisma";
import { ApiParam, ApiProperty } from "@nestjs/swagger";

@Controller("folders")
export class FoldersController {
    constructor(private readonly foldersService: FoldersService) { }

    @Get()
    @Roles(UserRoles.USER)
    async getFolders(@CurrentUser() user: { id: string }) {
        return this.foldersService.getFolders(user.id);
    }

    @Get(":id")
    @Roles(UserRoles.USER)
    @ApiParam({
        name: "id",
        type: "string",
        description: "Folder id",
    })
    async getFolderDataById(@CurrentUser() user: { id: string }, @Param("id") folderId: string) {
        return this.foldersService.getFolderDataById(folderId);
    }

    @Post()
    @Roles(UserRoles.USER)
    @ApiProperty({
        type: "object",
        properties: {
            folderName: { type: "string" },
            parentFolderId: { type: "string" },
        },
    })
    async createFolder(@CurrentUser() user: { id: string }, @Body() body: { folderName: string, parentFolderId?: string }) {
        return this.foldersService.createFolder(user.id, body.folderName, body.parentFolderId);
    }

    @Put(":id")
    @Roles(UserRoles.USER)
    @ApiParam({
        name: "id",
        type: "string",
        description: "Folder id",
    })
    @ApiProperty({
        type: "object",
        properties: {
            folderName: { type: "string" },
        },
    })
    async updateFolder(@CurrentUser() user: { id: string }, @Param("id") folderId: string, @Body() body: { folderName: string }) {
        return this.foldersService.updateFolder(folderId, body.folderName);
    }

    @Delete(":id")
    @ApiParam({
        name: "id",
        type: "string",
        description: "Folder id",
    })
    @Roles(UserRoles.USER)
    async deleteFolder(@CurrentUser() user: { id: string }, @Param("id") folderId: string) {
        return this.foldersService.deleteFolder(folderId);
    }
}