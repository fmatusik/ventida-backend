import { Module } from "@nestjs/common";
import { ListingService } from "./listing.service";
import { ListingController } from "./listing.controller";
import { CategoryModule } from "../category/category.module";

@Module({
    imports: [CategoryModule],
    controllers: [ListingController],
    providers: [ListingService],
    exports: [ListingService]
})
export class ListingModule {}