import { IsNumber } from 'class-validator';

export class CreateViewDto {
  @IsNumber()
  listingId: number;
}
