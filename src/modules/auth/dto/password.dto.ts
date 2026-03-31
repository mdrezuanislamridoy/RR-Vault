import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token received from forgot-password response', example: 'resetToken123' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: '6-digit code sent to email', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'New password (min 6 characters)', example: 'NewSecurePassword123!', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current active password', example: 'OldPassword123!' })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ description: 'New password (min 6 characters)', example: 'NewSecurePassword123!', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
