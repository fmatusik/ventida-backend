import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './models/user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth.module';
import { ListingModule } from './models/listing/listing.module';
import { ReviewModule } from './models/review/review.module';
import { ChatModule } from './models/chat/chat.module';
import { MessageModule } from './models/message/message.module';
import { FavouriteModule } from './models/favourite/favourite.module';
import { CategoryModule } from './models/category/category.module';
import { AttributeModule } from './models/attribute/attribute.module';
import { AttributeValueModule } from './models/attribute-value/attribute-value.module';
import { AddressModule } from './models/address/address.module';
import { ViewModule } from './models/view/view.module';
import { UploadModule } from './additional/upload.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        const secret = config.JWT_SECRET;
        if (typeof secret !== 'string' || secret.length < 32) {
          throw new Error(
            'JWT_SECRET musi być ustawiony w .env i mieć min. 32 znaki (np. `openssl rand -hex 32`).',
          );
        }
        return config;
      },
    }),
    // Globalny limit: 120 żądań / minutę na IP (ostrzejsze limity na wrażliwych endpointach)
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      // wyłącznie dla testów e2e, które i tak wykonują setki żądań z jednego IP
      skipIf: () =>
        process.env.NODE_ENV === 'test' && process.env.DISABLE_THROTTLE === 'true',
    }),
    UserModule,
    ListingModule,
    ReviewModule,
    ChatModule,
    MessageModule,
    FavouriteModule,
    CategoryModule,
    AttributeModule,
    AttributeValueModule,
    AddressModule,
    ViewModule,
    PrismaModule,
    AuthModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
