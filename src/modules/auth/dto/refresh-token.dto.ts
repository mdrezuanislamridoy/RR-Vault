import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'A valid refresh token previously issued', example: 'eyJhbGciOiJIUzI1...' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
