import { BadRequestException } from '@nestjs/common';
import type { ProblemFieldError } from '@paritas/shared';

/** Thrown by the global validation pipe; carries field-level errors to the client. */
export class RequestValidationException extends BadRequestException {
  constructor(readonly fieldErrors: ProblemFieldError[]) {
    super('One or more fields are invalid.');
  }
}
