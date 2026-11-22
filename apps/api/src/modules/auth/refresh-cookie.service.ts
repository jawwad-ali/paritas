import { Injectable } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AppConfigService } from '../../config/app-config.service.js';
import { MS_PER_DAY } from '../sessions/sessions.constants.js';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from './auth.constants.js';

/**
 * The refresh token lives only in this cookie: httpOnly (JavaScript cannot read
 * it, so XSS cannot steal it) and scoped to the auth endpoints.
 */
@Injectable()
export class RefreshCookieService {
  constructor(private readonly config: AppConfigService) {}

  set(response: Response, token: string): void {
    response.cookie(REFRESH_COOKIE_NAME, token, {
      ...this.baseOptions(),
      maxAge: this.config.get('REFRESH_TOKEN_TTL_DAYS') * MS_PER_DAY,
    });
  }

  clear(response: Response): void {
    response.clearCookie(REFRESH_COOKIE_NAME, this.baseOptions());
  }

  read(request: Request): string | undefined {
    const cookies: unknown = request.cookies;
    if (typeof cookies !== 'object' || cookies === null) {
      return undefined;
    }
    const value: unknown = (cookies as Record<string, unknown>)[REFRESH_COOKIE_NAME];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private baseOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get('AUTH_COOKIE_SECURE'),
      sameSite: this.config.get('AUTH_COOKIE_SAMESITE'),
      path: REFRESH_COOKIE_PATH,
    };
  }
}
