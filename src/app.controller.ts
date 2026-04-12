import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudService } from './modules/cloud/cloud.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cloudService: CloudService,
  ) {}

  @Get('ping')
  @Public()
  ping() {
    return { message: 'Pong!' };
  }

  @Post('api/v1/validate')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Validate credentials and optionally upload file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Optional file to upload',
        },
        appId: { type: 'string', description: 'The application ID' },
        apiKey: { type: 'string', description: 'The public API key' },
        secretKey: { type: 'string', description: 'The private secret key' },
        folder: {
          type: 'string',
          description: 'Optional folder path if uploading',
        },
      },
      required: ['appId', 'apiKey', 'secretKey'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Credentials are valid or file uploaded successfully',
  })
  async validate(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      appId: string;
      apiKey: string;
      secretKey: string;
      folder?: string;
    },
  ) {
    const validationResult = await this.appService.validate(
      body.appId,
      body.apiKey,
      body.secretKey,
    );

    if (file) {
      const uploadResult = await this.cloudService.uploadFile(
        file,
        validationResult.userId,
        body.folder,
      );
      return {
        ...uploadResult,
        valid: true,
      };
    }

    return {
      success: true,
      valid: true,
      message: 'Credentials are valid',
    };
  }
}
