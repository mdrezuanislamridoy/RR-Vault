import { Controller, Get } from "@nestjs/common";
import { AdminDashboardService } from "./admin-dashboard.service";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags('Admin Dashboard Overview')
@Controller('admin-dashboard/overview')
export class AdminDashboardController {
    constructor(private readonly adminDashboardService: AdminDashboardService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get overall dashboard statistics' })
    async getStats() {
        return this.adminDashboardService.getDashboardStats();
    }
}