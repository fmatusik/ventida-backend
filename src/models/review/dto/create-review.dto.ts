import { IsInt, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';
import { EmptyToUndefined } from '../../../common/validators';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @IsInt()
  @Min(1)
  reviewed_user_id: number;
}
