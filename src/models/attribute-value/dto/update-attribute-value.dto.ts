import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateAttributeValueDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsNumber()
  attributeId?: number;

  @IsOptional()
  @IsNumber()
  listingId?: number;
}
