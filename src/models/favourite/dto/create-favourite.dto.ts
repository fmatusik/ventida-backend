import { IsNumber } from 'class-validator';

export class CreateFavouriteDto {

    //make it unique
  @IsNumber()
  listingId: number;
}
