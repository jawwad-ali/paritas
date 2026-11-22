import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@paritas/shared';
import { ROLES_KEY } from '../auth.constants.js';

/** Restricts a controller or route to the listed roles. Without it, any signed-in user may call it. */
export const Roles = (...roles: [UserRole, ...UserRole[]]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
