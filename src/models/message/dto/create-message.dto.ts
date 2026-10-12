import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMessageDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1, { message: 'Wiadomość nie może być pusta' })
  @MaxLength(2000)
  message: string;

  @IsInt()
  @Min(1)
  chatId: number;
}
