import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT') ?? 587,
      secure: false,
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"MyCloud" <${this.config.getOrThrow<string>('SMTP_USER')}>`,
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${subject}`, err);
      throw new InternalServerErrorException(
        'Failed to send email. Please try again later.',
      );
    }
  }

  async sendVerificationCode(
    email: string,
    name: string,
    code: string,
  ): Promise<void> {
    await this.send(
      email,
      'Verify Your Email - RR_Vault',
      `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Hi ${name}, welcome to RR_Vault!</h2>
        <p style="color: #555;">Please verify your email using the code below. It expires in <strong>15 minutes</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5;">${code}</span>
        </div>
        <p style="color: #999; font-size: 13px;">If you did not create an account, please ignore this email.</p>
      </div>
      `,
    );
  }

  async sendPasswordResetCode(
    email: string,
    name: string,
    code: string,
  ): Promise<void> {
    await this.send(
      email,
      'Password Reset Code - MyCloud',
      `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Hi ${name},</h2>
        <p style="color: #555;">You requested a password reset. Use the code below. It expires in <strong>15 minutes</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5;">${code}</span>
        </div>
        <p style="color: #999; font-size: 13px;">If you did not request this, please ignore this email.</p>
      </div>
      `,
    );
  }
}
