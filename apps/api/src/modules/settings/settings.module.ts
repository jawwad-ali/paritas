import { Module } from '@nestjs/common';
import { MatchingSettingsController } from './matching-settings.controller.js';
import { MatchingSettingsService } from './matching-settings.service.js';

/** Runtime configuration that administrators change without a deploy. */
@Module({
  controllers: [MatchingSettingsController],
  providers: [MatchingSettingsService],
})
export class SettingsModule {}
