import { IsString, IsNumber } from 'class-validator';

export class CreateAttributeValueDto {
  @IsString()
  value: string;

  @IsNumber()
  attributeId: number;

  @IsNumber()
  listingId: number;
}
