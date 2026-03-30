import { Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { AppsService } from "./apps.service";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRoles } from "@prisma";

@Controller("apps")
export class AppController {
    constructor(private readonly appService: AppsService) { }

    @Get()
    @Roles(UserRoles.USER)
    async getApps(@CurrentUser() user: { id: string }) {
        return this.appService.getApps(user.id);
    }

    @Get(":id")
    @Roles(UserRoles.USER)
    async getAppById(@CurrentUser() user: { id: string }, @Param("id") id: string) {
        return this.appService.getAppById(id);
    }

    @Post()
    @Roles(UserRoles.USER)
    async createApp(@CurrentUser() user: { id: string }) {
        return this.appService.createApp(user.id);
    }

    @Delete(":id")
    @Roles(UserRoles.USER)
    async deleteApp(@CurrentUser() user: { id: string }, @Param("id") id: string) {
        return this.appService.deleteApp(id);
    }
}