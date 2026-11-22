import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  type AuthSessionResponse,
  type ChangePasswordRequest,
  changePasswordRequestSchema,
  CSRF_HEADER,
  CSRF_HEADER_VALUE,
  type LoginRequest,
  loginRequestSchema,
  type UserDto,
} from '@paritas/shared';
import type { Request, Response } from 'express';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { LOGIN_THROTTLE } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import type { IssuedSession } from './auth.types.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { CsrfHeaderGuard } from './guards/csrf-header.guard.js';
import { RefreshCookieService } from './refresh-cookie.service.js';

const CSRF_HEADER_DOC = {
  name: CSRF_HEADER,
  required: true,
  schema: { default: CSRF_HEADER_VALUE },
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly refreshCookie: RefreshCookieService,
  ) {}

  @Public()
  @Throttle(LOGIN_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in; sets the refresh cookie and returns an access token' })
  async login(
    @Body({ schema: loginRequestSchema }) body: LoginRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponse> {
    return this.respond(response, await this.auth.login(body));
  }

  @Public()
  @UseGuards(CsrfHeaderGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(CSRF_HEADER_DOC)
  @ApiOperation({
    summary: 'Exchange the refresh cookie for a new access token (rotates the cookie)',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponse> {
    try {
      return this.respond(response, await this.auth.refresh(this.refreshCookie.read(request)));
    } catch (error) {
      // A dead session should not leave a dead cookie behind.
      this.refreshCookie.clear(response);
      throw error;
    }
  }

  @Public()
  @UseGuards(CsrfHeaderGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiHeader(CSRF_HEADER_DOC)
  @ApiOperation({ summary: 'End the current session and clear the refresh cookie' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.logout(this.refreshCookie.read(request));
    this.refreshCookie.clear(response);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'The signed-in user' })
  me(@CurrentUser() actor: RequestActor): Promise<UserDto> {
    return this.auth.me(actor);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change own password; signs out all other sessions' })
  async changePassword(
    @CurrentUser() actor: RequestActor,
    @Body({ schema: changePasswordRequestSchema }) body: ChangePasswordRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponse> {
    return this.respond(response, await this.auth.changePassword(actor, body));
  }

  private respond(response: Response, session: IssuedSession): AuthSessionResponse {
    this.refreshCookie.set(response, session.refreshToken);
    return session.response;
  }
}
