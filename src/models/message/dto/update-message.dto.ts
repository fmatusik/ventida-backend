import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/** Edytować można wyłącznie treść własnej wiadomości - status przeczytania ustawia osobny endpoint. */
export class UpdateMessageDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;
}
