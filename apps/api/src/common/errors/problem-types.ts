/** RFC 9457 `type` values. `about:blank` means "the HTTP status says it all". */
export const PROBLEM_TYPES = {
  GENERIC: 'about:blank',
  VALIDATION: '/problems/validation-error',
  INTERNAL: '/problems/internal-error',
} as const;
