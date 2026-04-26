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
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
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
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
