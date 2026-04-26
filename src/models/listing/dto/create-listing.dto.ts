import { IsString, IsNumber, IsBoolean, IsOptional, IsEmail, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ListingImageDto {
  @IsString()
  url: string;

  @IsNumber()
  position: number;
}

export class CreateListingDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsBoolean()
  is_negotiable?: boolean;

  @IsString()
  status: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsNumber()
  categoryId: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListingImageDto)
  images?: ListingImageDto[];
}