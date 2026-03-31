import { Controller, Get, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CloudService } from './cloud.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Cloud Strategy (File Management)')
@ApiBearerAuth()
@Controller('cloud')
export class CloudController {
  constructor(private readonly cloudService: CloudService) { }

  @Get()
  @Roles('USER')
  @ApiOperation({ summary: "Get all cloud files", description: "Role: USER" })
  getAllFiles(@CurrentUser('sub') userId: string) {
    return this.cloudService.getAllFiles(userId);
  }

  @Get(':id')
  @Roles('USER')
  @ApiOperation({ summary: "Get specific cloud file by ID", description: "Role: USER" })
  getFile(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.cloudService.getFile(id, userId);
  }

  @Delete(':id')
  @Roles('USER')
  @ApiOperation({ summary: "Delete specific cloud file by ID", description: "Role: USER" })
  deleteFile(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.cloudService.deleteFile(id, userId);
  }
}
