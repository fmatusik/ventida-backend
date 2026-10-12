import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { USERNAME_REGEX } from '../../../common/validators';

export class CreateUserDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  // bcrypt obcina wejście po 72 bajtach - dłuższe hasła nie dają dodatkowego bezpieczeństwa
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  })
  @MaxLength(72)
  password: string;

  @IsOptional()
  @IsString()
  @Matches(USERNAME_REGEX, {
    message: 'Nazwa użytkownika: 3-30 znaków (litery, cyfry, _ . -)',
  })
  username?: string;
}
