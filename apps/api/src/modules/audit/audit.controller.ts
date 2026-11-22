import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type AuditLogDto,
  type ListAuditLogsQuery,
  listAuditLogsQuerySchema,
  type Paginated,
} from '@paritas/shared';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AuditService } from './audit.service.js';

@ApiTags('Audit')
@ApiBearerAuth()
@Roles('ADMIN', 'MANAGER')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Search the append-only audit trail (newest first)' })
  list(
    @Query({ schema: listAuditLogsQuerySchema }) query: ListAuditLogsQuery,
  ): Promise<Paginated<AuditLogDto>> {
    return this.audit.list(query);
  }
}
