import {
  Controller,
  Get,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { CloudService } from './cloud.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Cloud Strategy (File Management)')
@ApiBearerAuth()
@Controller('cloud')
export class CloudController {
  constructor(private readonly cloudService: CloudService) {}

  @Post('upload')
  @Roles('USER')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file', description: 'Role: USER' })
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('sub') userId: string,
    @Query('folder') folder?: string,
  ) {
    return this.cloudService.uploadFile(file, userId, folder);
  }

  @Get()
  @Roles('USER')
  @ApiOperation({ summary: 'Get all cloud files', description: 'Role: USER' })
  getAllFiles(@CurrentUser('sub') userId: string) {
    return this.cloudService.getAllFiles(userId);
  }

  @Get(':id/download')
  @Roles('USER')
  @ApiOperation({ summary: 'Download a file by ID', description: 'Role: USER' })
  async downloadFile(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Res() res: Response,
  ) {
    return this.cloudService.downloadFile(id, userId, res);
  }

  @Get(':id')
  @Roles('USER')
  @ApiOperation({
    summary: 'Get specific cloud file by ID',
    description: 'Role: USER',
  })
  getFile(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.cloudService.getFile(id, userId);
  }

  @Delete(':id')
  @Roles('USER')
  @ApiOperation({
    summary: 'Delete specific cloud file by ID',
    description: 'Role: USER',
  })
  deleteFile(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.cloudService.deleteFile(id, userId);
  }
}
