import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Token received after registration', example: 'eyJhbGci...' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: '6-digit code sent to email', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ResendVerificationDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;
}
