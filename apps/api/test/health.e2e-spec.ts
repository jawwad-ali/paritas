import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { PROBLEM_JSON_CONTENT_TYPE, REQUEST_ID_HEADER } from '@paritas/shared';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { AppConfigService } from '../src/config/app-config.service.js';

/** Runs against the real PostgreSQL + Redis from docker-compose (`pnpm infra:up`). */
describe('Health & error contract (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ rawBody: true });
    configureApp(app, app.get(AppConfigService));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health/live → 200', async () => {
    const res = await request(app.getHttpServer()).get('/api/health/live').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/health/ready → 200 with database and redis up', async () => {
    const res = await request(app.getHttpServer()).get('/api/health/ready').expect(200);
    expect(res.body.info.database.status).toBe('up');
    expect(res.body.info.redis.status).toBe('up');
  });

  it('unknown route → RFC 9457 problem with a request id', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/does-not-exist').expect(404);

    expect(res.headers['content-type']).toContain(PROBLEM_JSON_CONTENT_TYPE);
    expect(res.body).toMatchObject({ status: 404, title: 'Not Found' });
    expect(res.body.requestId).toBe(res.headers[REQUEST_ID_HEADER]);
  });

  it('echoes a caller-supplied request id', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health/live')
      .set(REQUEST_ID_HEADER, 'trace-abc');
    expect(res.headers[REQUEST_ID_HEADER]).toBe('trace-abc');
  });
});
