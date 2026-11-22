import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@paritas/shared';
import { ROLES_KEY } from '../auth.constants.js';
import type { AuthenticatedRequest } from '../auth.types.js';

/** Global guard, runs after JwtAuthGuard: enforces @Roles() when present. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) {
      throw new UnauthorizedException();
    }
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`This action requires one of: ${requiredRoles.join(', ')}.`);
    }
    return true;
  }
}
