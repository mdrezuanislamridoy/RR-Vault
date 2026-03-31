import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password.dto';
import { ResendVerificationDto, VerifyEmailDto } from './dto/verify.dto';
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
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with code' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification code' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user and get tokens' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Send forgot password email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token/code' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password from settings', description: 'Requires Authentication' })
  changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Post('logout')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user', description: 'Requires Authentication' })
  logout(@CurrentUser('sub') userId: string) {
    return this.authService.logout(userId);
  }

  @Post('refresh-token')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh JWT access token', description: 'Requires Authentication' })
  refreshToken(@CurrentUser('sub') userId: string) {
    return this.authService.refreshAccessToken(userId);
  }

  @Get('profile')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logged in user profile', description: 'Requires Authentication' })
  getProfile(@CurrentUser('sub') userId: string) {
    return this.authService.getProfile(userId);
  }

  // ─── Google OAuth ────────────────────────────────────────────────────────────

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @ApiOperation({ summary: 'Redirects to Google for OAuth Login' })
  googleLogin() {
    // Redirects to Google — handled by passport
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback handler' })
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
