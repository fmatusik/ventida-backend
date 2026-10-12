import { IsInt, IsString, MaxLength, Min } from 'class-validator';

export class CreateAttributeValueDto {
  @IsString() @MaxLength(200)
  value: string;

  @IsInt() @Min(1)
  attributeId: number;

  @IsInt() @Min(1)
  listingId: number;
}
