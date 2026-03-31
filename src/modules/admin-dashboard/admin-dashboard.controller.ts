import { Controller } from "@nestjs/common";
import { AdminDashboardService } from "./admin-dashboard.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags('Admin Dashboard Overview')
@Controller('admin-dashboard')
export class AdminDashboardController {
    constructor(private readonly adminDashboardService: AdminDashboardService) { }
}