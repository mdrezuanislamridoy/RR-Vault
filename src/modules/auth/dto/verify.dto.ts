import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Token received after registration' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: '6-digit code sent to email' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ResendVerificationDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}
