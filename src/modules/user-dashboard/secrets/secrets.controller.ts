import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { SecretsService } from "./secrets.service";
import { Roles } from "@/common/decorators/roles.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { ApiBody, ApiOperation, ApiParam, ApiTags, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags('User Dashboard: Secrets')
@ApiBearerAuth()
@Controller('secrets')
export class SecretsController {
    constructor(private readonly secretsService: SecretsService) { }

    @Get("get-secret-key")
    @Roles("USER")
    @ApiOperation({ summary: "Get user's secret key", description: "Role: USER" })
    async getSecretKey(@CurrentUser() user: { id: string }) {
        return this.secretsService.getSecretKey(user.id);
    }

    @Get('get-api-key')
    @Roles("USER")
    @ApiOperation({ summary: "Get user's API key", description: "Role: USER" })
    async getApiKey(@CurrentUser() user: { id: string }) {
        return this.secretsService.getApiKey(user.id);
    }

    @Post('generate-secret')
    @Roles("USER")
    @ApiOperation({ summary: "Generate a new secret key", description: "Role: USER" })
    async createSecret(@CurrentUser() user: { id: string }) {
        return this.secretsService.generateSecretKey(user.id);
    }

    @Patch('update-secret-key')
    @Roles("USER")
    @ApiOperation({ summary: "Update the user's API secret", description: "Role: USER" })
    async updateSecretKey(@CurrentUser() user: { id: string }) {
        return this.secretsService.updateApiSecret(user.id);
    }

    @Get('get-app-ids')
    @Roles("USER")
    @ApiOperation({ summary: "Get all App IDs for the user", description: "Role: USER" })
    async getAppIds(@CurrentUser() user: { id: string }) {
        return this.secretsService.getAppIds(user.id);
    }

    @Get('get-app-details/:appId')
    @Roles("USER")
    @ApiOperation({ summary: "Get details for a specific App ID", description: "Role: USER" })
    @ApiParam({ name: 'appId', required: true, description: 'App ID to fetch' })
    async getAppDetails(@CurrentUser() user: { id: string }, @Param('appId') appId: string) {
        return this.secretsService.appDetails(user.id, appId);
    }

    @Post('generate-app-id')
    @Roles("USER")
    @ApiOperation({ summary: "Generate a new App ID", description: "Role: USER" })
    @ApiBody({
        type: 'object',
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'my-app' },
            },
            required: ['name'],
        },
    })
    async generateAppId(@CurrentUser() user: { id: string }, @Body() body: { name: string }) {
        return this.secretsService.generateAppId(user.id, body.name);
    }

    @Patch('update-api-secret')
    @Roles("USER")
    @ApiOperation({ summary: "Update API Secret (Duplicate Endpoint)", description: "Role: USER" })
    async updateApiSecret(@CurrentUser() user: { id: string }) {
        return this.secretsService.updateApiSecret(user.id);
    }

    @Patch('delete-app-id/:appId')
    @Roles("USER")
    @ApiOperation({ summary: "Delete an App ID", description: "Role: USER" })
    @ApiParam({ name: 'appId', required: true, description: 'App ID to delete' })
    async deleteAppId(@CurrentUser() user: { id: string }, @Param('appId') appId: string) {
        return this.secretsService.deleteAppId(user.id, appId);
    }
}