import { IsInt, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';
import { EmptyToUndefined } from '../../../common/validators';

export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
