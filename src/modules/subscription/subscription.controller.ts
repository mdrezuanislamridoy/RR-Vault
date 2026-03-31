import { Controller, Delete, Param, Post, Body, Get, Put } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { CreateSubscriptionPlanDto } from "./dto/create-subscription-plan.dto";
import { Roles } from "@/common/decorators/roles.decorator";
import { ApiParam, ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@ApiTags('Subscription Plans (User & Admin)')
@Controller('subscription')
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) { }

    @Post()
    @Roles("ADMIN")
    @ApiBearerAuth()
    @ApiOperation({ summary: "Create a new subscription plan", description: "Role: ADMIN" })
    async createSubscriptionPlan(@Body() dto: CreateSubscriptionPlanDto) {
        return this.subscriptionService.createSubscriptionPlan(dto);
    }

    @Get()
    @ApiOperation({ summary: "Get all available subscription plans", description: "Public/User Endpoint" })
    async getAllSubscriptionPlans() {
        return this.subscriptionService.getAllSubscriptionPlans();
    }

    @Get(':id')
    @ApiOperation({ summary: "Get subscription plan by ID", description: "Public/User Endpoint" })
    @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
    async getSubscriptionPlanById(@Param('id') id: string) {
        return this.subscriptionService.getSubscriptionPlanById(id);
    }

    @Put(':id')
    @Roles("ADMIN")
    @ApiBearerAuth()
    @ApiOperation({ summary: "Update an existing subscription plan", description: "Role: ADMIN" })
    @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
    async updateSubscriptionPlan(@Param('id') id: string, @Body() dto: CreateSubscriptionPlanDto) {
        return this.subscriptionService.updateSubscriptionPlan(id, dto);
    }

    @Delete(':id')
    @Roles("ADMIN")
    @ApiBearerAuth()
    @ApiOperation({ summary: "Delete a subscription plan", description: "Role: ADMIN" })
    @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
    async deleteSubscriptionPlan(@Param('id') id: string) {
        return this.subscriptionService.deleteSubscriptionPlan(id);
    }

    @Post(':id/subscribe')
    @ApiBearerAuth()
    @ApiOperation({ summary: "Subscribe user to a plan", description: "Role: USER" })
    @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
    async subscribe(@Param('id') id: string, @CurrentUser() user: {
        id: string;
        email: string;
        role: string;
    }) {
        return this.subscriptionService.subscribe(id, user.id);
    }

    @Post(':id/unsubscribe')
    @ApiBearerAuth()
    @ApiOperation({ summary: "Unsubscribe user from a plan", description: "Role: USER" })
    @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
    async unsubscribe(@Param('id') id: string, @CurrentUser() user: {
        id: string;
        email: string;
        role: string;
    }) {
        return this.subscriptionService.unsubscribe(id, user.id);
    }
}