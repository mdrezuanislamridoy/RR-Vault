import { Controller, Get } from "@nestjs/common";
import { OverviewService } from "./overview.service";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRoles } from "@prisma";
import { ApiOperation } from "@nestjs/swagger";

@Controller("overview")
export class OverviewController {
    constructor(private readonly overviewService: OverviewService) { }

    @Get()
    @ApiOperation({ summary: "Get overview by user", description: "Role: USER" })
    @Roles(UserRoles.USER)
    async getOverview(@CurrentUser() user: { id: string }) {
        return this.overviewService.getOverview(user.id);
    }

    @Get("analytics")
    @ApiOperation({ summary: "Get analytics by user", description: "Role: USER" })
    @Roles(UserRoles.USER)
    async getAnalytics(@CurrentUser() user: { id: string }) {
        return this.overviewService.getAnalytics(user.id);
    }

    @Get("recent-uploads")
    @ApiOperation({ summary: "Get recent uploads by user", description: "Role: USER" })
    @Roles(UserRoles.USER)
    async getRecentUploads(@CurrentUser() user: { id: string }) {
        return this.overviewService.getResentUploads(user.id);
    }
}