import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateListingImageDto {
  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;
}
