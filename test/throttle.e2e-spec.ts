import request from 'supertest';
import { NestExpressApplication } from '@nestjs/platform-express';
import { createTestApp, TEST_DB } from './helpers';

const describeIf = TEST_DB ? describe : describe.skip;

describeIf('Rate limiting (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    delete process.env.DISABLE_THROTTLE;
    app = await createTestApp();
  });
  afterAll(async () => app.close());

  it('blokuje brute-force na logowaniu po 10 próbach (429)', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'brute@example.com', password: 'Wrong1234!' });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses.slice(10)).toEqual([429, 429]);
  });
});
