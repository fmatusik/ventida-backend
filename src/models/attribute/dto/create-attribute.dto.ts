import { IsIn, IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateAttributeDto {
  @IsString() @MinLength(1) @MaxLength(60)
  name: string;

  @IsIn(['text', 'number', 'boolean', 'select'])
  type: string;

  @IsInt() @Min(1)
  categoryId: number;
}
