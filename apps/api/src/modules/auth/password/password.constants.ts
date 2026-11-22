import type { Options } from '@node-rs/argon2';

/**
 * Argon2id with OWASP's recommended minimum (19 MiB, 2 iterations, 1 lane).
 * @node-rs/argon2 defaults to Argon2id; the cost parameters are pinned here so a
 * library upgrade cannot silently weaken them.
 * https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 */
export const ARGON2_OPTIONS: Options = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

/** Hashed once at startup; verifying against it keeps "unknown email" as slow as "wrong password". */
export const TIMING_EQUALIZER_PASSWORD = 'paritas-timing-equalizer';
