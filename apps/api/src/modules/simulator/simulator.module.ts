import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module.js';
import { SimulatorController } from './simulator.controller.js';
import { SimulatorService } from './simulator.service.js';
import { StripeTestGateway } from './stripe-test-gateway.service.js';

/** Demo-data generator standing in for the merchant's checkout and internal ledger. */
@Module({
  imports: [IngestionModule],
  controllers: [SimulatorController],
  providers: [SimulatorService, StripeTestGateway],
})
export class SimulatorModule {}
