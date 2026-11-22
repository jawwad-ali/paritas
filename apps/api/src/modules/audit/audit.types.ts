import type { Prisma } from '../../generated/prisma/client.js';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import type { AuditAction, AuditEntityType } from './audit.constants.js';

export interface AuditEntry {
  action: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  /** `{ before, after }` for updates, the new entity for creates. Must be JSON-safe. */
  changes?: Prisma.InputJsonValue;
  /** Extra facts not captured by the request context (e.g. an attempted email). */
  details?: Record<string, Prisma.InputJsonValue>;
  /**
   * Overrides the actor taken from the request context. Needed when the actor is
   * established during the request itself (e.g. a successful login).
   */
  actor?: RequestActor;
}

/** A Prisma client or an interactive-transaction client. */
export type AuditWriter = Pick<Prisma.TransactionClient, 'auditLog'>;
