import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { RequestActor } from '../../../common/request-context/request-context.types.js';
import type { AuthenticatedRequest } from '../auth.types.js';

/** Injects the authenticated user. Only valid on routes guarded by authentication. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestActor => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException();
    }
    return request.user;
  },
);
