import { envSchema } from './env.schema.js';

const validEnv = {
  CORS_ORIGINS: 'http://localhost:3000, https://app.example.com',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  INTERNAL_LEDGER_WEBHOOK_SECRET: 'b'.repeat(32),
};

describe('envSchema', () => {
  it('applies defaults and parses typed values', () => {
    const env = envSchema.parse(validEnv);

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(4000);
    expect(env.SWAGGER_ENABLED).toBe(false);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3000', 'https://app.example.com']);
  });

  it('parses "false" as false (not truthy like z.coerce.boolean)', () => {
    expect(envSchema.parse({ ...validEnv, SWAGGER_ENABLED: 'false' }).SWAGGER_ENABLED).toBe(false);
    expect(envSchema.parse({ ...validEnv, SWAGGER_ENABLED: 'true' }).SWAGGER_ENABLED).toBe(true);
  });

  it('rejects a non-postgres DATABASE_URL', () => {
    const result = envSchema.safeParse({ ...validEnv, DATABASE_URL: 'mysql://localhost/db' });
    expect(result.success).toBe(false);
  });

  it('rejects missing required variables', () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(false);
    const missing = result.error?.issues.map((issue) => issue.path.join('.'));
    expect(missing).toEqual(expect.arrayContaining(['CORS_ORIGINS', 'DATABASE_URL']));
  });

  it('rejects an out-of-range port', () => {
    expect(envSchema.safeParse({ ...validEnv, PORT: '70000' }).success).toBe(false);
  });
});
