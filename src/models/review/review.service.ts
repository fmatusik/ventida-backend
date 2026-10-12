import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { Review } from "@prisma/client";
import { PUBLIC_USER_SELECT } from "../../common/user-select";


@Injectable()
export class ReviewService {
    constructor(private prisma: PrismaService) {}

    async create(data: CreateReviewDto, reviewerId: number): Promise<Review> {
        // Sprawdzenie czy użytkownik nie recenzjonuje sam siebie
        if (reviewerId === data.reviewed_user_id) {
            throw new BadRequestException('Nie możesz recenzjonować samego siebie');
        }

        // Sprawdzenie czy użytkownik istnieje
        const user = await this.prisma.user.findUnique({
            where: { id: data.reviewed_user_id }
        });

        if (!user) {
            throw new NotFoundException('Użytkownik o tym ID nie istnieje');
        }

        // Sprawdzenie czy już istnieje recenzja od tego użytkownika
        const existingReview = await this.prisma.review.findFirst({
            where: {
                reviewer_id: reviewerId,
                reviewed_user_id: data.reviewed_user_id
            }
        });

        if (existingReview) {
            throw new BadRequestException('Już dodałeś recenzję dla tego użytkownika');
        }

        return await this.prisma.review.create({
            data: {
                rating: data.rating,
                comment: data.comment,
                reviewed_user_id: data.reviewed_user_id,
                reviewer_id: reviewerId
            },
            include: {
                reviewer: { select: PUBLIC_USER_SELECT },
                reviewedUser: { select: PUBLIC_USER_SELECT }
            }
        });
    }

    async getByUserId(userId: number) {
        const reviews = await this.prisma.review.findMany({
            where: { reviewed_user_id: userId },
            include: { reviewer: { select: PUBLIC_USER_SELECT } },
            orderBy: { created_at: 'desc' }
        });
        return reviews;
    }

    async getById(id: number): Promise<any> {
        const review = await this.prisma.review.findUnique({
            where: { id },
            include: {
                reviewer: { select: PUBLIC_USER_SELECT },
                reviewedUser: { select: PUBLIC_USER_SELECT }
            }
        });

        if (!review) {
            throw new NotFoundException(`Recenzja o ID ${id} nie znaleziona`);
        }

        return review;
    }

    async update(id: number, data: UpdateReviewDto, reviewerId: number): Promise<Review> {
        const review = await this.prisma.review.findUnique({ where: { id } });

        if (!review) {
            throw new NotFoundException(`Recenzja o ID ${id} nie znaleziona`);
        }

        if (review.reviewer_id !== reviewerId) {
            throw new ForbiddenException('Brak uprawnień do edycji tej recenzji');
        }

        return await this.prisma.review.update({
            where: { id },
            data,
            include: {
                reviewer: { select: PUBLIC_USER_SELECT },
                reviewedUser: { select: PUBLIC_USER_SELECT }
            }
        });
    }

    async delete(id: number, reviewerId: number): Promise<void> {
        const review = await this.prisma.review.findUnique({ where: { id } });

        if (!review) {
            throw new NotFoundException(`Recenzja o ID ${id} nie znaleziona`);
        }

        if (review.reviewer_id !== reviewerId) {
            throw new ForbiddenException('Brak uprawnień do usunięcia tej recenzji');
        }

        await this.prisma.review.delete({ where: { id } });
    }

    async getByReviewer(reviewerId: number) {
        return await this.prisma.review.findMany({
            where: { reviewer_id: reviewerId },
            include: {
                reviewer: { select: PUBLIC_USER_SELECT },
                reviewedUser: { select: PUBLIC_USER_SELECT }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async getAverageRating(userId: number) {
        const agg = await this.prisma.review.aggregate({
            where: { reviewed_user_id: userId },
            _avg: { rating: true },
            _count: true
        });

        return {
            averageRating: agg._avg.rating ?? 0,
            reviewCount: agg._count
        };
    }
}