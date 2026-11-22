import type { AuthSessionResponse } from '@paritas/shared';
import type { Request } from 'express';
import type { RequestActor } from '../../common/request-context/request-context.types.js';

export type AuthenticatedRequest = Request & { user?: RequestActor };

/** What the auth service hands the controller: the body plus the cookie to set. */
export interface IssuedSession {
  response: AuthSessionResponse;
  refreshToken: string;
}
