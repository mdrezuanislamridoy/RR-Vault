import { Module } from "@nestjs/common";
import { OverviewService } from "./overview.service";
import { OverviewController } from "./overview.controoler";

@Module({
    providers: [OverviewService],
    controllers: [OverviewController],
    exports: [OverviewService],
})
export class OverviewModule { }