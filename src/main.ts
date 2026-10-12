import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { UPLOAD_DIR } from './additional/upload.controller';

export function configureApp(app: NestExpressApplication) {
  app.disable('x-powered-by');
  // Za reverse proxy (Heroku/Render/nginx) throttler widzi prawdziwe IP klienta
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

  app.use(
    helmet({
      // zdjęcia z /uploads są wczytywane przez frontend z innej domeny
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Wgrane zdjęcia: bez listowania katalogu, z nosniff i izolującym CSP (obrazy nie mogą wykonać skryptu)
  app.useStaticAssets(UPLOAD_DIR, {
    prefix: '/uploads',
    index: false,
    dotfiles: 'deny',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  });

  const origins = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    maxAge: 600,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // usuwa nieznane pola z requestu
      forbidNonWhitelisted: true, // wyrzuca błąd przy nieznanych polach
      transform: true, // automatycznie konwertuje typy
    }),
  );
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  await app.listen(process.env.PORT ?? 6969);
}

if (require.main === module) {
  bootstrap();
}
