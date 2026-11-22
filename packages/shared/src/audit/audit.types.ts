export interface AuditLogDto {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  changes: unknown;
  metadata: unknown;
  createdAt: string;
}
