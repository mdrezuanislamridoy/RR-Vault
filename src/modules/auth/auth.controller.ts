import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password.dto';
import { ResendVerificationDto, VerifyEmailDto } from './dto/verify.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { GoogleAuthGuard } from './strategies/google.guard';
import { GoogleUser } from '@/common/decorators/google-user.decorator';
import { GoogleUser as GoogleUserType } from './strategies/google.strategy';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRoles } from '@prisma';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) { }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Post('logout')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  logout(@CurrentUser('sub') userId: string) {
    return this.authService.logout(userId);
  }

  @Post('refresh-token')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  refreshToken(@CurrentUser('sub') userId: string) {
    return this.authService.refreshAccessToken(userId);
  }

  @Get('profile')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  getProfile(@CurrentUser('sub') userId: string) {
    return this.authService.getProfile(userId);
  }

  // ─── Google OAuth ────────────────────────────────────────────────────────────

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleLogin() {
    // Redirects to Google — handled by passport
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@GoogleUser() user: GoogleUserType, @Res() res: Response) {
    const result = await this.authService.googleLogin(user);
    const token = result.data?.accessToken;
    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';

    if (!token) {
      return res.redirect(`${frontendUrl}/auth/error`);
    }

    return res.redirect(`${frontendUrl}/auth/success?token=${token}`);
  }
}
