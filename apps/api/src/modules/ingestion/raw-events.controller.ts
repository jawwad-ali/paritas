import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type ListRawEventsQuery,
  listRawEventsQuerySchema,
  type Paginated,
  type RawEventDetailDto,
  type RawEventDto,
} from '@paritas/shared';
import { uuidSchema } from '../../common/validation/common.schemas.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RawEventsService } from './raw-events.service.js';

@ApiTags('Raw events')
@ApiBearerAuth()
@Roles('ADMIN', 'MANAGER')
@Controller('raw-events')
export class RawEventsController {
  constructor(private readonly rawEvents: RawEventsService) {}

  @Get()
  @ApiOperation({ summary: 'Inbound events exactly as sources sent them (newest first)' })
  list(
    @Query({ schema: listRawEventsQuerySchema }) query: ListRawEventsQuery,
  ): Promise<Paginated<RawEventDto>> {
    return this.rawEvents.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One raw event including its original payload' })
  get(@Param('id', { schema: uuidSchema }) id: string): Promise<RawEventDetailDto> {
    return this.rawEvents.getById(id);
  }

  @Post(':id/replay')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Re-process a FAILED or IGNORED event' })
  replay(@Param('id', { schema: uuidSchema }) id: string): Promise<RawEventDetailDto> {
    return this.rawEvents.replay(id);
  }
}
