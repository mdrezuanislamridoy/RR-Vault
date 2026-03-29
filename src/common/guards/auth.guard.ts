import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';
import { PrismaService } from '@/lib/prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Access token is missing');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Access token is invalid or expired');
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        isDeleted: true,
        isBlocked: true,
        isEmailVerified: true,
        refreshToken: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }

    if (user.isDeleted) {
      throw new UnauthorizedException('This account has been deleted');
    }

    if (user.isBlocked) {
      throw new ForbiddenException(
        'Your account has been blocked. Please contact support',
      );
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Please verify your email to continue');
    }

    request['user'] = { id: payload.sub, ...payload, role: user.role };

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    if (!requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException(
        `Access denied. Required role: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.split(' ')[1] ?? null;
  }
}
