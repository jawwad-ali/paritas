import type { UserRole } from '@paritas/shared';

/** The authenticated principal behind a request. */
export interface RequestActor {
  id: string;
  email: string;
  role: UserRole;
}

/** Per-request data available anywhere in the call chain, without parameter drilling. */
export interface RequestContextStore {
  requestId?: string;
  ip?: string;
  userAgent?: string;
  actor?: RequestActor;
}
