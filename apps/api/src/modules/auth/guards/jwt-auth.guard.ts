import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestContextService } from '../../../common/request-context/request-context.service.js';
import { AUTH_ERRORS, IS_PUBLIC_KEY } from '../auth.constants.js';
import type { AuthenticatedRequest } from '../auth.types.js';
import { AccessTokenService } from '../tokens/access-token.service.js';

const BEARER_PREFIX = 'Bearer ';

const extractBearerToken = (request: AuthenticatedRequest): string | null => {
  const header = request.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) {
    return null;
  }
  const token = header.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
};

/** Global guard: authenticates every HTTP route unless it is marked @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokens: AccessTokenService,
    private readonly context: RequestContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException(AUTH_ERRORS.MISSING_BEARER_TOKEN);
    }

    const actor = await this.accessTokens.verify(token);
    request.user = actor;
    this.context.setActor(actor);
    return true;
  }
}
