import { GetReviewDto } from "./dto/get-review.dto";
import formatTimeAgo from "../../additional/formatAgo.time";

export class ReviewMapper {
    static toGetReview(
        review: {
            id: number;
            rating: number;
            comment: string | null;
            created_at: Date;
            reviewer: { username?: string | null };
        }
    ): GetReviewDto {
        return {
            id: review.id,
            rating: review.rating,
            comment: review.comment ?? '',
            created_at: formatTimeAgo(review.created_at),
            reviewer_name: review.reviewer.username ?? "No name"
        }
    }
}
