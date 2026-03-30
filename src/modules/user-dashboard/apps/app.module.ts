import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppsService } from "./apps.service";

@Module({
    controllers: [AppController],
    providers: [AppsService],
    exports: [AppsService],
})
export class AppsModule { }