import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ListingModule } from '../listing/listing.module';
import { ReviewModule } from '../review/review.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [ListingModule, ReviewModule],
   exports: [UserService]
})
export class UserModule {}
