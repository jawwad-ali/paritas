import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type MatchingConfigDto,
  type UpdateMatchingConfigRequest,
  updateMatchingConfigRequestSchema,
} from '@paritas/shared';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { MatchingSettingsService } from './matching-settings.service.js';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings/matching')
export class MatchingSettingsController {
  constructor(private readonly settings: MatchingSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Current matching rules (everyone can see why decisions were made)' })
  get(): Promise<MatchingConfigDto> {
    return this.settings.get();
  }

  @Patch()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Change matching rules; applies to the next evaluation (audited)' })
  update(
    @Body({ schema: updateMatchingConfigRequestSchema }) body: UpdateMatchingConfigRequest,
    @CurrentUser() actor: RequestActor,
  ): Promise<MatchingConfigDto> {
    return this.settings.update(body, actor);
  }
}
