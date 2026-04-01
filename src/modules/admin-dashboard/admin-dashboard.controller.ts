import { Controller, Get } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('Admin Dashboard Overview')
@ApiBearerAuth()
@Controller('admin-dashboard/overview')
@Roles('ADMIN')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get overall dashboard statistics' })
  async getStats() {
    return this.adminDashboardService.getDashboardStats();
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get user growth and subscription analytics for last 6 months',
  })
  async getAnalytics() {
    return this.adminDashboardService.getAnalytics();
  }

  @Get('recent-users')
  @ApiOperation({ summary: 'Get 5 most recently registered users' })
  async getRecentUsers() {
    return this.adminDashboardService.getRecentUsers();
  }

  @Get('apps')
  @ApiOperation({ summary: 'Get all user apps across platform' })
  async getAllApps() {
    return this.adminDashboardService.getAllApps();
  }
}
