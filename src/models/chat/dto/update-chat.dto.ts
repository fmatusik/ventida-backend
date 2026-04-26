import { IsOptional, IsNumber } from 'class-validator';

export class UpdateChatDto {
  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsNumber()
  listingId?: number;
}
