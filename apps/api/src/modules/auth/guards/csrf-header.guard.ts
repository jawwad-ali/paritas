import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CSRF_HEADER, CSRF_HEADER_VALUE } from '@paritas/shared';
import type { Request } from 'express';
import { AUTH_ERRORS } from '../auth.constants.js';

/**
 * Protects cookie-authenticated endpoints from cross-site request forgery: a
 * hostile page cannot set a custom header without passing the CORS allow-list.
 */
@Injectable()
export class CsrfHeaderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.get(CSRF_HEADER) !== CSRF_HEADER_VALUE) {
      throw new ForbiddenException(AUTH_ERRORS.MISSING_CSRF_HEADER);
    }
    return true;
  }
}
