/**
 * RFC 9457 "Problem Details for HTTP APIs".
 * Every non-2xx response from the API uses this shape, so the web app
 * can render errors with one code path.
 */
export interface ProblemDetails {
  /** URI reference identifying the problem type. */
  type: string;
  /** Short, human-readable summary of the problem type. */
  title: string;
  /** HTTP status code. */
  status: number;
  /** Human-readable explanation specific to this occurrence. */
  detail?: string;
  /** URI reference identifying this specific occurrence (the request path). */
  instance?: string;
  /** Correlation id, matches the `x-request-id` response header. */
  requestId?: string;
  /** Field-level validation errors, when the problem is a validation failure. */
  errors?: ProblemFieldError[];
}

export interface ProblemFieldError {
  /** Dot-separated path to the offending field, e.g. `filters.dateFrom`. */
  path: string;
  message: string;
}

export const PROBLEM_JSON_CONTENT_TYPE = 'application/problem+json';
