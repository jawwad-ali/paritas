import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USER_ROLES } from '@paritas/shared';
import { z } from 'zod';
import type { RequestActor } from '../../../common/request-context/request-context.types.js';
import { AppConfigService } from '../../../config/app-config.service.js';
import { AUTH_ERRORS } from '../auth.constants.js';

/** Claims are re-validated after the signature check: defence in depth against key misuse. */
const accessTokenClaimsSchema = z.object({
  sub: z.uuid(),
  email: z.email(),
  role: z.enum(USER_ROLES),
});

type AccessTokenClaims = z.infer<typeof accessTokenClaimsSchema>;

export interface SignedAccessToken {
  token: string;
  expiresIn: number;
}

/** Short-lived, stateless JWTs (HS256) proving who the caller is and their role. */
@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async sign(actor: RequestActor): Promise<SignedAccessToken> {
    const claims: AccessTokenClaims = { sub: actor.id, email: actor.email, role: actor.role };
    return {
      token: await this.jwt.signAsync(claims),
      expiresIn: this.config.get('JWT_ACCESS_TTL_SECONDS'),
    };
  }

  /** Throws UnauthorizedException for any invalid, expired or malformed token. */
  async verify(token: string): Promise<RequestActor> {
    let payload: unknown;
    try {
      payload = await this.jwt.verifyAsync<object>(token);
    } catch {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_ACCESS_TOKEN);
    }

    const claims = accessTokenClaimsSchema.safeParse(payload);
    if (!claims.success) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_ACCESS_TOKEN);
    }
    return { id: claims.data.sub, email: claims.data.email, role: claims.data.role };
  }
}
