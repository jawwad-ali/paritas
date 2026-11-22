import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type SimulatorRunRequest,
  simulatorRunRequestSchema,
  type SimulatorRunResult,
} from '@paritas/shared';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SimulatorService } from './simulator.service.js';

@ApiTags('Simulator')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('simulator')
export class SimulatorController {
  constructor(private readonly simulator: SimulatorService) {}

  @Post('runs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate demo payments on both sides (gateway + internal ledger) with anomalies',
  })
  run(
    @Body({ schema: simulatorRunRequestSchema }) body: SimulatorRunRequest,
  ): Promise<SimulatorRunResult> {
    return this.simulator.run(body);
  }
}
