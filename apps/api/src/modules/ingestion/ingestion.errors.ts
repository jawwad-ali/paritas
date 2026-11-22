/**
 * The payload is structurally invalid. Retrying cannot help, so the worker
 * fails the event immediately instead of burning its retry budget.
 */
export class InvalidEventPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEventPayloadError';
  }
}
