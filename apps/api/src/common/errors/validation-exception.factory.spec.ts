import { validationExceptionFactory } from './validation-exception.factory.js';

describe('validationExceptionFactory', () => {
  it('flattens issue paths into dot notation', () => {
    const exception = validationExceptionFactory([
      { message: 'Required', path: ['filters', { key: 'dateFrom' }] },
      { message: 'Invalid body' },
    ]);

    expect(exception.fieldErrors).toEqual([
      { path: 'filters.dateFrom', message: 'Required' },
      { path: '(root)', message: 'Invalid body' },
    ]);
  });
});
