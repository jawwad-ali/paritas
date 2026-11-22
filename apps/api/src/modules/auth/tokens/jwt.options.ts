import type { JwtModuleOptions } from '@nestjs/jwt';
import type { AppConfigService } from '../../../config/app-config.service.js';
import { JWT_ALGORITHM, JWT_AUDIENCE, JWT_ISSUER } from '../auth.constants.js';

export const buildJwtOptions = (config: AppConfigService): JwtModuleOptions => ({
  secret: config.get('JWT_ACCESS_SECRET'),
  signOptions: {
    algorithm: JWT_ALGORITHM,
    expiresIn: config.get('JWT_ACCESS_TTL_SECONDS'),
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  },
  verifyOptions: {
    // Pinning the algorithm blocks "alg: none" and algorithm-confusion attacks.
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  },
});
