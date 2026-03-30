import { Controller, Delete, Param, Post, Body, Get, Put } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { CreateSubscriptionPlanDto } from "./dto/create-subscription-plan.dto";
import { Roles } from "@/common/decorators/roles.decorator";
import { ApiParam } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@Controller('subscription')
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) { }

    @Post()
    @Roles("ADMIN")
    async createSubscriptionPlan(@Body() dto: CreateSubscriptionPlanDto) {
        return this.subscriptionService.createSubscriptionPlan(dto);
    }

    @Get()
    async getAllSubscriptionPlans() {
        return this.subscriptionService.getAllSubscriptionPlans();
    }

    @Get(':id')
    @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
    async getSubscriptionPlanById(@Param('id') id: string) {
        return this.subscriptionService.getSubscriptionPlanById(id);
    }

    @Put(':id')
    @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
    @Roles("ADMIN")
    async updateSubscriptionPlan(@Param('id') id: string, @Body() dto: CreateSubscriptionPlanDto) {
        return this.subscriptionService.updateSubscriptionPlan(id, dto);
    }

    @Delete(':id')
    @Roles("ADMIN")
    @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
    async deleteSubscriptionPlan(@Param('id') id: string) {
        return this.subscriptionService.deleteSubscriptionPlan(id);
    }

    @Post(':id/subscribe')
    @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
    async subscribe(@Param('id') id: string,@CurrentUser() user :{
        id: string;
        email: string;
        role: string;
    }) {
        return this.subscriptionService.subscribe(id,user.id);
    }

    @Post(':id/unsubscribe')
    @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
    async unsubscribe(@Param('id') id: string,@CurrentUser() user :{
        id: string;
        email: string;
        role: string;
    }) {
        return this.subscriptionService.unsubscribe(id,user.id);
    }
}