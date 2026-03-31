import { Controller, Delete, Get, Param, Post, Body } from "@nestjs/common";
import { AppsService } from "./apps.service";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRoles } from "@prisma";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateAppDto } from "./dto/create-app.dto";

@ApiTags('User Dashboard: Apps')
@ApiBearerAuth()
@Controller("apps")
export class AppController {
    constructor(private readonly appService: AppsService) { }

    @Get()
    @Roles(UserRoles.USER)
    @ApiOperation({ summary: "Get all applications", description: "Role: USER" })
    async getApps(@CurrentUser() user: { id: string }) {
        return this.appService.getApps(user.id);
    }

    @Get(":id")
    @Roles(UserRoles.USER)
    @ApiOperation({ summary: "Get application by ID", description: "Role: USER" })
    async getAppById(@CurrentUser() user: { id: string }, @Param("id") id: string) {
        return this.appService.getAppById(user.id, id);
    }

    @Post()
    @Roles(UserRoles.USER)
    @ApiOperation({ summary: "Create a new application", description: "Role: USER" })
    async createApp(@CurrentUser() user: { id: string }, @Body() dto: CreateAppDto) {
        return this.appService.createApp(user.id, dto);
    }

    @Delete(":id")
    @Roles(UserRoles.USER)
    @ApiOperation({ summary: "Delete an application", description: "Role: USER" })
    async deleteApp(@CurrentUser() user: { id: string }, @Param("id") id: string) {
        return this.appService.deleteApp(user.id, id);
    }
}