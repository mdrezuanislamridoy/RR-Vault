import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { GoogleUser as GoogleUserType } from '@/modules/auth/strategies/google.strategy';

export const GoogleUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): GoogleUserType => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as GoogleUserType;
  },
);
