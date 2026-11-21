import { HttpStatus, NotFoundException } from '@nestjs/common';
import { PROBLEM_TYPES } from '../errors/problem-types.js';
import { RequestValidationException } from '../errors/request-validation.exception.js';
import { toProblemDetails } from './problem-details.mapper.js';

const context = { path: '/api/v1/things/42', requestId: 'req-123' };

describe('toProblemDetails', () => {
  it('maps HttpException to its status and message', () => {
    const problem = toProblemDetails(new NotFoundException('Thing 42 not found'), context);

    expect(problem).toEqual({
      type: PROBLEM_TYPES.GENERIC,
      title: 'Not Found',
      status: HttpStatus.NOT_FOUND,
      detail: 'Thing 42 not found',
      instance: context.path,
      requestId: context.requestId,
    });
  });

  it('includes field errors for validation failures', () => {
    const errors = [{ path: 'amount', message: 'Must be positive' }];
    const problem = toProblemDetails(new RequestValidationException(errors), context);

    expect(problem.status).toBe(HttpStatus.BAD_REQUEST);
    expect(problem.type).toBe(PROBLEM_TYPES.VALIDATION);
    expect(problem.errors).toEqual(errors);
  });

  it('hides internals of unknown errors behind a generic 500', () => {
    const problem = toProblemDetails(new Error('relation "users" does not exist'), context);

    expect(problem.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(problem.type).toBe(PROBLEM_TYPES.INTERNAL);
    expect(problem.detail).not.toContain('relation');
    expect(problem.requestId).toBe('req-123');
  });
});
