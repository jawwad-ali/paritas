import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type DashboardOverviewDto,
  type DashboardQuery,
  dashboardQuerySchema,
} from '@paritas/shared';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { DashboardService } from './dashboard.service.js';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Match rate, volumes, exception flow and daily trend for the last 7 or 30 days',
  })
  overview(
    @Query({ schema: dashboardQuerySchema }) query: DashboardQuery,
    @CurrentUser() actor: RequestActor,
  ): Promise<DashboardOverviewDto> {
    return this.dashboard.overview(query, actor);
  }
}
