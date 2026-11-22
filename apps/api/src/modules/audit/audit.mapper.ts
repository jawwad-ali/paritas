import type { AuditLogDto } from '@paritas/shared';
import type { AuditLog } from '../../generated/prisma/client.js';

export const toAuditLogDto = (log: AuditLog): AuditLogDto => ({
  id: log.id,
  actorId: log.actorId,
  actorEmail: log.actorEmail,
  action: log.action,
  entityType: log.entityType,
  entityId: log.entityId,
  changes: log.changes,
  metadata: log.metadata,
  createdAt: log.createdAt.toISOString(),
});
