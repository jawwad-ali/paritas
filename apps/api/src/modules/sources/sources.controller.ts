import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type SourceDto,
  type UpdateSourceRequest,
  updateSourceRequestSchema,
} from '@paritas/shared';
import { uuidSchema } from '../../common/validation/common.schemas.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SourcesService } from './sources.service.js';

@ApiTags('Sources')
@ApiBearerAuth()
@Controller('sources')
export class SourcesController {
  constructor(private readonly sources: SourcesService) {}

  @Get()
  @ApiOperation({ summary: 'Connected transaction sources with volume and last activity' })
  list(): Promise<SourceDto[]> {
    return this.sources.list();
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Enable or disable a source' })
  update(
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: updateSourceRequestSchema }) body: UpdateSourceRequest,
  ): Promise<SourceDto> {
    return this.sources.update(id, body);
  }
}
