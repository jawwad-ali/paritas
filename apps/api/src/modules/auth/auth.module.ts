import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigService } from '../../config/app-config.service.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { CsrfHeaderGuard } from './guards/csrf-header.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { PasswordModule } from './password/password.module.js';
import { RefreshCookieService } from './refresh-cookie.service.js';
import { AccessTokenService } from './tokens/access-token.service.js';
import { buildJwtOptions } from './tokens/jwt.options.js';

@Module({
  imports: [
    JwtModule.registerAsync({ inject: [AppConfigService], useFactory: buildJwtOptions }),
    PasswordModule,
    SessionsModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenService,
    RefreshCookieService,
    CsrfHeaderGuard,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AccessTokenService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
