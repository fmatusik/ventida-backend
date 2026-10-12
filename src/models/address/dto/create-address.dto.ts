import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { EmptyToUndefined, PHONE_REGEX } from '../../../common/validators';

export class CreateAddressDto {
  @IsString() @MinLength(1) @MaxLength(60)
  name: string;

  @IsString() @MinLength(1) @MaxLength(60)
  surname: string;

  @EmptyToUndefined()
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Nieprawidłowy numer telefonu' })
  phone_number?: string;

  @IsString() @MinLength(2) @MaxLength(60)
  country: string;

  @IsString() @MinLength(1) @MaxLength(80)
  town: string;

  @IsString() @MinLength(1) @MaxLength(100)
  street: string;

  @IsString() @MinLength(1) @MaxLength(20)
  building_number: string;

  @EmptyToUndefined()
  @IsOptional() @IsString() @MaxLength(20)
  apartment_number?: string;

  @IsString() @MinLength(2) @MaxLength(20)
  zip: string;
}
