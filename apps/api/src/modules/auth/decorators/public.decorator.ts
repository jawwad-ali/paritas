import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../auth.constants.js';

/**
 * Opts a route out of authentication. Every route is protected by default
 * (secure by default); public routes must say so explicitly.
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
