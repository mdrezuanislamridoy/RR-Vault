import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { GetSubscriptionsDto } from './dto/get-subscriptions.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin Subscription Management')
@ApiBearerAuth()
@Controller('admin-dashboard/subscription')
@UseGuards(AuthGuard)
@Roles('ADMIN')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  @Get()
  @ApiOperation({ summary: 'Get Subscriptions List', description: 'Fetch all user subscriptions with filters. Role: ADMIN' })
  @ApiResponse({ status: 200, description: 'List of subscriptions' })
  async getSubscriptions(@Query() query: GetSubscriptionsDto) {
    return this.subscriptionService.getSubscriptions(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Subscription', description: 'Edit subscription status, plan mapping. Role: ADMIN' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  async updateSubscription(
    @Param('id') id: string,
    @Body() updateData: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.updateSubscription(id, updateData);
  }
}
