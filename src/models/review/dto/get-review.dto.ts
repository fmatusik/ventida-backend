export class GetReviewDto {
    id: number;
    rating: number;
    comment?: string;
    created_at: string;
    reviewer_name: string;
}