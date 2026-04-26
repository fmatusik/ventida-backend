import { IsString, IsNumber, Min } from 'class-validator';

export class CreateListingImageDto {
  @IsString()
  url: string;

  @IsNumber()
  @Min(0)
  position: number;

  @IsNumber()
  listingId: number;
}
