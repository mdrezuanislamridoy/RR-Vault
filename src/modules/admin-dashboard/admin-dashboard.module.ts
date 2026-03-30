import { Module } from "@nestjs/common";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminDashboardService } from "./admin-dashboard.service";

@Module({
    imports: [],
    controllers: [AdminDashboardController],
    providers: [AdminDashboardService],
    exports: [AdminDashboardService],
})
export class AdminDashboardModule { }