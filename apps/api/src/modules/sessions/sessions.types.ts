import type { Prisma } from '../../generated/prisma/client.js';

/** A Prisma client or an interactive-transaction client. */
export type SessionWriter = Pick<Prisma.TransactionClient, 'refreshToken'>;

export type RotationResult =
  /** Token exchanged; `token` is the new raw refresh token for the cookie. */
  | { outcome: 'rotated'; userId: string; token: string }
  /** Unknown, expired, revoked for another reason, or lost a concurrent rotation. */
  | { outcome: 'invalid' }
  /** An already-rotated token was replayed: likely stolen. The session was revoked. */
  | { outcome: 'reuse_detected'; userId: string };
