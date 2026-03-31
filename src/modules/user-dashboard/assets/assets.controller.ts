import { Controller, Delete, Get, Param } from "@nestjs/common";
import { AssetsService } from "./assets.service";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRoles } from "@prisma";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags('User Dashboard: Assets')
@ApiBearerAuth()
@Controller("assets")
export class AssetsController {
    constructor(private readonly assetsService: AssetsService) { }

    @Get()
    @Roles(UserRoles.USER)
    @ApiOperation({ summary: "Get all assets for current user", description: "Role: USER" })
    async getAssets(@CurrentUser() user: { id: string }) {
        return this.assetsService.getAssets(user.id);
    }

    @Get(":id")
    @Roles(UserRoles.USER)
    @ApiOperation({ summary: "Get asset details by ID", description: "Role: USER" })
    async getAssetById(@Param("id") id: string) {
        return this.assetsService.getAssetById(id);
    }

    @Delete(":id")
    @Roles(UserRoles.USER)
    @ApiOperation({ summary: "Delete an asset", description: "Role: USER" })
    async deleteAsset(@Param("id") id: string) {
        return this.assetsService.deleteAsset(id);
    }
}