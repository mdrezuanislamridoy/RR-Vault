import { Body, Controller, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@/common/guards/auth.guard";
import { SecretsService } from "./secrets.service";
import { Get, Param, Patch, Post } from "@nestjs/common";
import { Request } from "express";
import { Roles } from "@/common/decorators/roles.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { ApiParam } from "@nestjs/swagger";

@Controller('secrets')
@UseGuards(AuthGuard)
export class SecretsController {
    constructor(private readonly secretsService: SecretsService) { }

    @Get("get-secret-key")
    @Roles("USER")
    async getSecretKey(@CurrentUser() user: { id: string }) {
        return this.secretsService.getSecretKey(user.id);
    }

    @Post('generate-secret')
    @Roles("USER")
    async createSecret(@CurrentUser() user: { id: string }) {
        return this.secretsService.generateSecretKey(user.id);
    }

    @Patch('update-secret-key')
    @Roles("USER")
    async updateSecretKey(@CurrentUser() user: { id: string }) {
        return this.secretsService.updateApiSecret(user.id);
    }

    @Get('get-app-ids')
    @Roles("USER")
    async getAppIds(@CurrentUser() user: { id: string }) {
        return this.secretsService.getAppIds(user.id);
    }

    @Get('get-app-details/:appId')
    @Roles("USER")
    @ApiParam({ name: 'appId', required: true, description: 'App ID to fetch' })
    async getAppDetails(@CurrentUser() user: { id: string }, @Param('appId') appId: string) {
        return this.secretsService.appDetails(user.id, appId);
    }

    @Post('generate-app-id')
    @Roles("USER")
    async generateAppId(@CurrentUser() user: { id: string }, @Body() body: { name: string }) {
        return this.secretsService.generateAppId(user.id, body.name);
    }

    @Patch('update-api-secret')
    @Roles("USER")
    async updateApiSecret(@CurrentUser() user: { id: string }) {
        return this.secretsService.updateApiSecret(user.id);
    }

    @Patch('delete-app-id/:appId')
    @Roles("USER")
    @ApiParam({ name: 'appId', required: true, description: 'App ID to delete' })
    async deleteAppId(@CurrentUser() user: { id: string }, @Param('appId') appId: string) {
        return this.secretsService.deleteAppId(user.id, appId);
    }
}