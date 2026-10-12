import 'dotenv/config';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';

/**
 * Testy e2e działają na osobnej bazie (TEST_DATABASE_URL) - nigdy na bazie deweloperskiej/produkcyjnej.
 * Uruchomienie: TEST_DATABASE_URL=postgresql://... npm run test:e2e
 */
export const TEST_DB = process.env.TEST_DATABASE_URL;

export async function createTestApp(): Promise<NestExpressApplication> {
  if (!TEST_DB) throw new Error('Ustaw TEST_DATABASE_URL, aby uruchomić testy e2e');
  process.env.DATABASE_URL = TEST_DB;
  process.env.DIRECT_URL = TEST_DB;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET ??= 'test-secret-test-secret-test-secret-123456';

  // importy po ustawieniu zmiennych środowiskowych
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AppModule } = require('../src/app.module');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { configureApp } = require('../src/main');

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app);
  await app.init();
  return app;
}

// Minimalne poprawne obrazy (magic bytes) do testów uploadu
export const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32),
]);
