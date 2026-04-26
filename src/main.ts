import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  })
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // usuwa nieznane pola z requestu
    forbidNonWhitelisted: true, // wyrzuca błąd przy nieznanych polach
    transform: true, // automatycznie konwertuje typy
  }));
  await app.listen(process.env.PORT ?? 6969);
}
bootstrap();
