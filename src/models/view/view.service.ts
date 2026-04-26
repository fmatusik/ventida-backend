import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { View } from "@prisma/client";

@Injectable()
export class ViewService {
    constructor(private prisma: PrismaService) {}

    async recordView(listingId: number, userId: number): Promise<View> {
        // Sprawdzenie czy ogłoszenie istnieje
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId }
        });

        if (!listing) {
            throw new NotFoundException(`Ogłoszenie o ID ${listingId} nie znalezione`);
        }

        // Sprawdzenie czy użytkownik istnieje (opcjonalnie - mogą być anonimowe widoki)
        if (userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                throw new NotFoundException(`Użytkownik o ID ${userId} nie istnieje`);
            }
        }

        return await this.prisma.view.create({
            data: {
                listingId,
                userId
            }
        });
    }

    async getListingViewsCount(listingId: number): Promise<number> {
        return await this.prisma.view.count({
            where: { listingId }
        });
    }

    async getListingViews(listingId: number, skip = 0, take = 50) {
        return await this.prisma.view.findMany({
            where: { listingId },
            skip,
            take,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            },
            orderBy: { id: 'desc' }
        });
    }

    async getUserViews(userId: number, skip = 0, take = 50) {
        return await this.prisma.view.findMany({
            where: { userId },
            skip,
            take,
            include: {
                listing: {
                    include: {
                        category: true,
                        images: true
                    }
                }
            },
            orderBy: { id: 'desc' }
        });
    }

    async getViewsByDateRange(listingId: number, startDate: Date, endDate: Date) {
        return await this.prisma.view.findMany({
            where: {
                listingId,
                id: {
                    gte: startDate as any,
                    lte: endDate as any
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        });
    }

    async getUserListingViewCount(listingId: number, userId: number): Promise<number> {
        return await this.prisma.view.count({
            where: {
                listingId,
                userId
            }
        });
    }

    async getTotalViewsForUserListings(userId: number): Promise<number> {
        // Pobranie wszystkich ogłoszeń użytkownika
        const listings = await this.prisma.listing.findMany({
            where: { userId },
            select: { id: true }
        });

        const listingIds = listings.map(l => l.id);

        // Zliczenie widoków dla wszystkich ogłoszeń
        return await this.prisma.view.count({
            where: {
                listingId: {
                    in: listingIds
                }
            }
        });
    }

    async deleteViewsByListingId(listingId: number): Promise<void> {
        await this.prisma.view.deleteMany({
            where: { listingId }
        });
    }
}
