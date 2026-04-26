import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { Review } from "@prisma/client";


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
                ...data,
                reviewer_id: reviewerId
            },
            include: {
                reviewer: true,
                reviewedUser: true
            }
        });
    }

    async getByUserId(userId: number) {
        const reviews = await this.prisma.review.findMany({
            where: { reviewed_user_id: userId },
            include: { reviewer: true },
            orderBy: { created_at: 'desc' }
        });
        if(!reviews) return null;
        return reviews;
    }

    async getById(id: number): Promise<any> {
        const review = await this.prisma.review.findUnique({
            where: { id },
            include: {
                reviewer: true,
                reviewedUser: true
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
            throw new BadRequestException('Brak uprawnień do edycji tej recenzji');
        }

        return await this.prisma.review.update({
            where: { id },
            data,
            include: {
                reviewer: true,
                reviewedUser: true
            }
        });
    }

    async delete(id: number, reviewerId: number): Promise<void> {
        const review = await this.prisma.review.findUnique({ where: { id } });

        if (!review) {
            throw new NotFoundException(`Recenzja o ID ${id} nie znaleziona`);
        }

        if (review.reviewer_id !== reviewerId) {
            throw new BadRequestException('Brak uprawnień do usunięcia tej recenzji');
        }

        await this.prisma.review.delete({ where: { id } });
    }

    async getByReviewer(reviewerId: number) {
        return await this.prisma.review.findMany({
            where: { reviewer_id: reviewerId },
            include: {
                reviewer: true,
                reviewedUser: true
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