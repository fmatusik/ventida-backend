import { IsInt, IsOptional, IsString, Matches, MaxLength, MinLength, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString() @MinLength(1) @MaxLength(60)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug: małe litery, cyfry i myślniki' })
  @MaxLength(80)
  slug: string;

  @IsOptional() @IsInt() @Min(1)
  parent_id?: number;

  @IsOptional() @IsInt() @Min(0)
  position?: number;
}
