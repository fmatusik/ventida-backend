import { IsString, IsNumber } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  message: string;

  @IsNumber()
  chatId: number;
}
