import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type AssigneeDto,
  type ExceptionDetailDto,
  type ExceptionDto,
  type ExceptionStatsDto,
  type ListExceptionsQuery,
  listExceptionsQuerySchema,
  type Paginated,
} from '@paritas/shared';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { uuidSchema } from '../../common/validation/common.schemas.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ExceptionsQueryService } from './exceptions-query.service.js';

@ApiTags('Exceptions')
@ApiBearerAuth()
@Controller('exceptions')
export class ExceptionsController {
  constructor(private readonly exceptions: ExceptionsQueryService) {}

  @Get()
  @ApiOperation({ summary: 'Browse exceptions: filter, search, sort and paginate' })
  list(
    @Query({ schema: listExceptionsQuerySchema }) query: ListExceptionsQuery,
    @CurrentUser() actor: RequestActor,
  ): Promise<Paginated<ExceptionDto>> {
    return this.exceptions.list(query, actor);
  }

  // Static paths are declared before ':id' so they are never taken for an id.
  @Get('stats')
  @ApiOperation({ summary: 'Counts by status, and open counts by severity, type and owner' })
  stats(@CurrentUser() actor: RequestActor): Promise<ExceptionStatsDto> {
    return this.exceptions.stats(actor);
  }

  @Get('assignees')
  @ApiOperation({ summary: 'Active users an exception can be assigned to' })
  assignees(): Promise<AssigneeDto[]> {
    return this.exceptions.assignees();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Investigate: the records side by side and the full timeline' })
  get(@Param('id', { schema: uuidSchema }) id: string): Promise<ExceptionDetailDto> {
    return this.exceptions.getById(id);
  }
}
