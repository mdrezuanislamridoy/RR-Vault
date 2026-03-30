import { Controller, Get, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CloudService } from './cloud.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Cloud')
@ApiBearerAuth()
@Controller('cloud')
export class CloudController {
  constructor(private readonly cloudService: CloudService) { }

  @Get()
  @Roles('USER')
  getAllFiles(@CurrentUser('sub') userId: string) {
    return this.cloudService.getAllFiles(userId);
  }

  @Get(':id')
  @Roles('USER')
  getFile(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.cloudService.getFile(id, userId);
  }

  @Delete(':id')
  @Roles('USER')
  deleteFile(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.cloudService.deleteFile(id, userId);
  }
}
