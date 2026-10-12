import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  IsStrongPassword,
  IsISO31661Alpha2,
} from 'class-validator';
import { EmptyToNull, IsImageUrl, PHONE_REGEX, USERNAME_REGEX } from '../../../common/validators';

/** Pola, które użytkownik może zmienić we własnym profilu. */
export class UpdateUserDto {
  @EmptyToNull()
  @IsOptional() @IsString() @MaxLength(60)
  name?: string;

  @EmptyToNull()
  @IsOptional() @IsString() @MaxLength(60)
  surname?: string;

  @IsOptional()
  @IsString()
  @Matches(USERNAME_REGEX, {
    message: 'Nazwa użytkownika: 3-30 znaków (litery, cyfry, _ . -)',
  })
  username?: string;

  @EmptyToNull()
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Nieprawidłowy numer telefonu' })
  phone_number?: string;

  @EmptyToNull()
  @IsOptional() @IsImageUrl()
  pictureUrl?: string;

  @EmptyToNull()
  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;

  @EmptyToNull()
  @IsOptional() @IsString() @MaxLength(80)
  city?: string;

  @EmptyToNull()
  @IsOptional() @IsISO31661Alpha2()
  countryCode?: string;
}

export class UpdatePasswordDto {
  @IsString() @MaxLength(72)
  oldPassword: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  })
  @MaxLength(72)
  newPassword: string;
}
