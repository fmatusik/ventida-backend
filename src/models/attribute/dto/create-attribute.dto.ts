import { IsString, IsNumber } from 'class-validator';

export class CreateAttributeDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsNumber()
  categoryId: number;
}
