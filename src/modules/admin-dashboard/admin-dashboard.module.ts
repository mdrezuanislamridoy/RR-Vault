import { Module } from "@nestjs/common";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminDashboardService } from "./admin-dashboard.service";
import { UserManagementController } from "./user-management/user-management.controller";
import { UserManagementService } from "./user-management/user-management.service";
import { SubscriptionController } from "./subscription/subscription.controller";
import { SubscriptionService } from "./subscription/subscription.service";

@Module({
    imports: [],
    controllers: [AdminDashboardController, UserManagementController, SubscriptionController],
    providers: [AdminDashboardService, UserManagementService, SubscriptionService],
    exports: [AdminDashboardService, UserManagementService, SubscriptionService],
})
export class AdminDashboardModule { }