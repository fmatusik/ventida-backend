import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateMessageDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
}
