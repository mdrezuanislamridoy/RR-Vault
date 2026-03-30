import { Controller, Get } from "@nestjs/common";
import { OverviewService } from "./overview.service";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRoles } from "@prisma";

@Controller("overview")
export class OverviewController {
    constructor(private readonly overviewService: OverviewService) { }

    @Get()
    @Roles(UserRoles.USER)
    async getOverview(@CurrentUser() user: { id: string }) {
        return this.overviewService.getOverview(user.id);
    }

    @Get("analytics")
    @Roles(UserRoles.USER)
    async getAnalytics(@CurrentUser() user: { id: string }) {
        return this.overviewService.getAnalytics(user.id);
    }
}