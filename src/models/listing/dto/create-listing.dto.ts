import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmptyToUndefined, IsImageUrl, PHONE_REGEX } from '../../../common/validators';

export const LISTING_STATUSES = ['available', 'reserved', 'sold', 'archived'] as const;

export class ListingImageDto {
  @IsImageUrl()
  url: string;

  @IsInt()
  @Min(0)
  @Max(50)
  position: number;
}

export class CreateListingDto {
  @IsString()
  @MinLength(3, { message: 'Tytuł musi mieć co najmniej 3 znaki' })
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(10, { message: 'Opis musi mieć co najmniej 10 znaków' })
  @MaxLength(5000)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100_000_000)
  price: number;

  @IsOptional()
  @IsBoolean()
  is_negotiable?: boolean;

  @IsOptional()
  @IsIn(LISTING_STATUSES)
  status?: (typeof LISTING_STATUSES)[number];

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  location: string;

  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  contact_person?: string;

  @EmptyToUndefined()
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @EmptyToUndefined()
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Nieprawidłowy numer telefonu' })
  phone_number?: string;

  @IsInt()
  @Min(1)
  categoryId: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Maksymalnie 10 zdjęć' })
  @ValidateNested({ each: true })
  @Type(() => ListingImageDto)
  images?: ListingImageDto[];
}
