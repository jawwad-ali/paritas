import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service.js';

/** Refresh-token sessions; shared by auth (login/refresh) and users (deactivation). */
@Module({
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
