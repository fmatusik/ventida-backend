import { Review, User } from "@prisma/client";
import { GetReviewDto } from "./dto/get-review.dto";
import formatTimeAgo from "src/additional/formatAgo.time";

export class ReviewMapper {
    static toGetReview(
        review: Review & { reviewer: User}
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