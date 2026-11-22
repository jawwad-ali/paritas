import { Module } from '@nestjs/common';
import { PasswordModule } from '../auth/password/password.module.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [PasswordModule, SessionsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
