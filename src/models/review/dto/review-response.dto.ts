export class ReviewResponseDto {
  id: number;
  rating: number;
  comment?: string;
  created_at: Date;
  reviewer_id: number;
  reviewed_user_id: number;
}
