import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt, randomBytes } from 'crypto';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { MailService } from '@/modules/mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password.dto';
import { ResendVerificationDto, VerifyEmailDto } from './dto/verify.dto';
import { GoogleUser } from './strategies/google.strategy';
import { successResponse } from '@/common/response/index';
import { CryptoService } from '@/common/crypto/crypto.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly crypto: CryptoService,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private generateVerifyToken(userId: string): string {
    return this.jwt.sign(
      { sub: userId, purpose: 'email-verification' },
      { secret: this.config.getOrThrow('JWT_VERIFY_SECRET'), expiresIn: '15m' },
    );
  }

  private verifyToken(token: string, purpose: string): { sub: string } {
    try {
      const secret: string =
        purpose === 'email-verification'
          ? this.config.getOrThrow<string>('JWT_VERIFY_SECRET')
          : this.config.getOrThrow<string>('JWT_RESET_SECRET');

      const payload = this.jwt.verify<{ sub: string; purpose: string }>(token, {
        secret,
      });

      if (payload.purpose !== purpose) {
        throw new BadRequestException('Invalid token purpose');
      }

      return payload;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Invalid or expired token');
    }
  }

  private async generateAndStoreCode(
    userId: string,
    type: 'verify' | 'reset',
  ): Promise<{ code: string; token: string }> {
    const code = randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    const hashedCode = await bcrypt.hash(code, 10);

    const token =
      type === 'verify'
        ? this.generateVerifyToken(userId)
        : this.jwt.sign(
            { sub: userId, purpose: 'password-reset' },
            {
              secret: this.config.getOrThrow('JWT_RESET_SECRET'),
              expiresIn: '15m',
            },
          );

    const data =
      type === 'verify'
        ? {
            verifyCode: hashedCode,
            verifyCodeToken: token,
            verifyCodeExpiry: expiry,
          }
        : {
            resetCode: hashedCode,
            resetCodeToken: token,
            resetCodeExpiry: expiry,
          };

    await this.prisma.client.user.update({ where: { id: userId }, data });

    return { code, token };
  }

  // ─── Register ───────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    try {
      const existing = await this.prisma.client.user.findUnique({
        where: { email: dto.email },
      });

      if (existing && existing.isEmailVerified) {
        throw new ConflictException('Email already in use');
      }

      // Allow re-registration if email was never verified
      if (existing && !existing.isEmailVerified) {
        await this.prisma.client.user.delete({ where: { id: existing.id } });
      }

      const hashed: string = await bcrypt.hash(dto.password, 10);

      const user = await this.prisma.client.user.create({
        data: { name: dto.name, email: dto.email, password: hashed },
      });

      const { code, token } = await this.generateAndStoreCode(
        user.id,
        'verify',
      );

      await this.mail.sendVerificationCode(user.email, user.name, code);

      return successResponse(
        'Registered successfully. Please check your email for the verification code.',
        { token },
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  // ─── Verify Email ────────────────────────────────────────────────────────────

  async verifyEmail(dto: VerifyEmailDto) {
    try {
      const payload = this.verifyToken(dto.token, 'email-verification');

      const user = await this.prisma.client.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) throw new NotFoundException('User not found');

      if (user.isEmailVerified) {
        throw new BadRequestException('Email is already verified');
      }

      if (!user.verifyCode || !user.verifyCodeExpiry || !user.verifyCodeToken) {
        throw new BadRequestException(
          'No pending verification found. Please request a new code.',
        );
      }

      if (new Date() > user.verifyCodeExpiry) {
        throw new BadRequestException(
          'Verification code has expired. Please request a new one.',
        );
      }

      if (user.verifyCodeToken !== dto.token) {
        throw new BadRequestException(
          'Token does not match. Please request a new code.',
        );
      }

      const isCodeValid = await bcrypt.compare(dto.code, user.verifyCode);
      if (!isCodeValid)
        throw new BadRequestException('Invalid verification code');

      await this.prisma.client.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          verifyCode: null,
          verifyCodeToken: null,
          verifyCodeExpiry: null,
        },
      });

      // a 32 digit unique token
      const apiKey = randomBytes(32).toString('hex');

      await this.prisma.client.cloudSecret.create({
        data: {
          userId: user.id,
          api_key: this.crypto.encrypt(`ak_${apiKey}`),
        },
      });

      return successResponse('Email verified successfully');
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to verify email');
    }
  }

  // ─── Resend Verification ─────────────────────────────────────────────────────

  async resendVerification(dto: ResendVerificationDto) {
    try {
      const user = await this.prisma.client.user.findUnique({
        where: { email: dto.email },
      });

      if (!user)
        throw new NotFoundException('No account found with this email');

      if (user.isEmailVerified) {
        throw new BadRequestException('Email is already verified');
      }

      const { code, token } = await this.generateAndStoreCode(
        user.id,
        'verify',
      );

      await this.mail.sendVerificationCode(user.email, user.name, code);

      return successResponse(
        'Verification code resent. Please check your email.',
        { token },
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to resend verification code',
      );
    }
  }

  // ─── Login ───────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.client.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) throw new UnauthorizedException('Invalid credentials');

      if (user.isDeleted) {
        throw new UnauthorizedException('This account has been deleted');
      }

      if (user.isBlocked) {
        throw new ForbiddenException(
          'Your account has been blocked. Please contact support',
        );
      }

      if (!user.password) {
        if (user.accountType === 'GOOGLE') {
          throw new ForbiddenException(
            'This account is registered with Google. Please use Google Login.',
          );
        }
        throw new UnauthorizedException('Invalid credentials');
      }

      const isMatch = await bcrypt.compare(dto.password, user.password);
      if (!isMatch) throw new UnauthorizedException('Invalid credentials');

      if (!user.isEmailVerified) {
        throw new ForbiddenException(
          'Please verify your email before logging in',
        );
      }

      const accessToken = this.generateAccessToken(
        user.id,
        user.email,
        user.role,
      );
      const refreshToken = this.generateRefreshToken(user.id);

      const hashedRefresh: string = await bcrypt.hash(refreshToken, 10);

      await this.prisma.client.user.update({
        where: { id: user.id },
        data: { refreshToken: hashedRefresh },
      });

      return successResponse('Login successful', {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          accountType: user.accountType,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      console.log('Login error: ', error);
      throw new InternalServerErrorException('Failed to login');
    }
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    try {
      const user = await this.prisma.client.user.findUnique({
        where: { email: dto.email },
      });

      // Prevent email enumeration
      if (!user || !user.isEmailVerified) {
        return successResponse(
          'If this email exists, a reset code has been sent',
        );
      }

      const { code, token } = await this.generateAndStoreCode(user.id, 'reset');

      await this.mail.sendPasswordResetCode(user.email, user.name, code);

      return successResponse(
        'If this email exists, a reset code has been sent',
        {
          token,
        },
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to process forgot password request',
      );
    }
  }

  // ─── Reset Password ──────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    try {
      const payload = this.verifyToken(dto.token, 'password-reset');

      const user = await this.prisma.client.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.resetCode || !user.resetCodeExpiry) {
        throw new BadRequestException('Invalid or expired reset request');
      }

      if (new Date() > user.resetCodeExpiry) {
        throw new BadRequestException(
          'Reset code has expired. Please request a new one.',
        );
      }

      if (user.resetCodeToken !== dto.token) {
        throw new BadRequestException(
          'Token does not match. Please request a new code.',
        );
      }

      const isCodeValid = await bcrypt.compare(dto.code, user.resetCode);
      if (!isCodeValid) throw new BadRequestException('Invalid reset code');

      const hashed = await bcrypt.hash(dto.newPassword, 10);

      await this.prisma.client.user.update({
        where: { id: user.id },
        data: {
          password: hashed,
          resetCode: null,
          resetCodeToken: null,
          resetCodeExpiry: null,
        },
      });

      return successResponse('Password reset successfully');
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to reset password');
    }
  }

  // ─── Change Password ─────────────────────────────────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto) {
    try {
      const user = await this.prisma.client.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new NotFoundException('User not found');

      if (!user.password) {
        if (user.accountType === 'GOOGLE') {
          throw new ForbiddenException(
            'This account is registered with Google. You cannot change your password here.',
          );
        }
        throw new NotFoundException('User password record not found');
      }

      const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
      if (!isMatch) throw new BadRequestException('Old password is incorrect');

      const hashed = await bcrypt.hash(dto.newPassword, 10);

      await this.prisma.client.user.update({
        where: { id: userId },
        data: { password: hashed },
      });

      return successResponse('Password changed successfully');
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to change password');
    }
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  async logout(userId: string) {
    try {
      await this.prisma.client.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });
      return successResponse('Logged out successfully');
    } catch (error) {
      console.log('', error);

      throw new InternalServerErrorException('Failed to logout');
    }
  }

  // ─── Google Login ─────────────────────────────────────────────────────────

  async googleLogin(googleUser: GoogleUser) {
    try {
      let user = await this.prisma.client.user.findUnique({
        where: { email: googleUser.email },
      });

      if (user && user.isDeleted) {
        throw new UnauthorizedException('This account has been deleted');
      }

      if (user && user.isBlocked) {
        throw new ForbiddenException(
          'Your account has been blocked. Please contact support',
        );
      }

      if (!user) {
        user = await this.prisma.client.user.create({
          data: {
            name: googleUser.name,
            email: googleUser.email,
            profilePic: googleUser.profilePic,
            accountType: 'GOOGLE',
            isEmailVerified: true,
          },
        });
      } else if (user.accountType !== 'GOOGLE') {
        throw new ForbiddenException(
          'This email is registered with a password. Please login with email and password.',
        );
      }

      const accessToken = this.generateAccessToken(
        user.id,
        user.email,
        user.role,
      );
      const refreshToken = this.generateRefreshToken(user.id);

      const hashedRefresh: string = await bcrypt.hash(refreshToken, 10);

      await this.prisma.client.user.update({
        where: { id: user.id },
        data: { refreshToken: hashedRefresh },
      });

      return successResponse('Google login successful', {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          accountType: user.accountType,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process Google login');
    }
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────────

  async refreshAccessToken(rawRefreshToken: string) {
    try {
      // Step 1: Verify JWT signature and expiry
      let payload: { sub: string };
      try {
        payload = this.jwt.verify<{ sub: string }>(rawRefreshToken, {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        });
      } catch {
        throw new UnauthorizedException('Session expired. Please login again');
      }

      // Step 2: Fetch user and validate state
      const user = await this.prisma.client.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          refreshToken: true,
          isDeleted: true,
          isBlocked: true,
        },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Session expired. Please login again');
      }

      if (user.isDeleted)
        throw new UnauthorizedException('This account has been deleted');
      if (user.isBlocked)
        throw new ForbiddenException(
          'Your account has been blocked. Please contact support',
        );

      // Step 3: Compare raw token with stored hash
      const isValid = await bcrypt.compare(rawRefreshToken, user.refreshToken);
      if (!isValid) {
        await this.prisma.client.user.update({
          where: { id: user.id },
          data: { refreshToken: null },
        });
        throw new UnauthorizedException('Session expired. Please login again');
      }

      const accessToken = this.generateAccessToken(
        user.id,
        user.email,
        user.role,
      );

      return successResponse('Token refreshed successfully', { accessToken });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to refresh access token');
    }
  }

  // ─── Get Profile ──────────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    try {
      const user = await this.prisma.client.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profilePic: true,
          accountType: true,
          isEmailVerified: true,
          created_at: true,
        },
      });

      if (!user) throw new NotFoundException('User not found');

      return successResponse('Profile fetched successfully', user);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch profile');
    }
  }

  // ─── Token Generators ────────────────────────────────────────────────────────

  generateAccessToken(userId: string, email: string, role: string): string {
    return this.jwt.sign(
      { sub: userId, email, role },
      { secret: this.config.getOrThrow('JWT_ACCESS_SECRET'), expiresIn: '1h' },
    );
  }

  generateRefreshToken(userId: string): string {
    return this.jwt.sign(
      { sub: userId },
      { secret: this.config.getOrThrow('JWT_REFRESH_SECRET'), expiresIn: '7d' },
    );
  }
}
