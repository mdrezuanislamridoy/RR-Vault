import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post('api/v1/validate')
  @Public()
  @ApiOperation({ summary: 'Validate cloud application credentials' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        appId: { type: 'string', description: 'The application ID' },
        apiKey: { type: 'string', description: 'The public API key' },
        secretKey: { type: 'string', description: 'The private secret key' },
      },
      required: ['appId', 'apiKey', 'secretKey']
    }
  })
  @ApiResponse({ status: 201, description: 'Credentials are valid', schema: { example: { valid: true } } })
  @ApiResponse({ status: 400, description: 'Invalid secrets or no secrets found' })
  validate(@Body() body: {
    appId: string,
    apiKey: string,
    secretKey: string
  }) {
    return this.appService.validate(body.appId, body.apiKey, body.secretKey)
  }
}
