import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Favourite } from "@prisma/client";

@Injectable()
export class FavouriteService {
    constructor(private prisma: PrismaService) {}

    async addFavourite(listingId: number, userId: number): Promise<Favourite> {
        // Sprawdzenie czy ogłoszenie istnieje
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId }
        });

        if (!listing) {
            throw new NotFoundException(`Ogłoszenie o ID ${listingId} nie znalezione`);
        }

        // Sprawdzenie czy ulubieniec już istnieje
        const existingFavourite = await this.prisma.favourite.findFirst({
            where: {
                userId,
                listingId
            }
        });

        if (existingFavourite) {
            throw new BadRequestException('To ogłoszenie jest już w ulubionych');
        }

        return await this.prisma.favourite.create({
            data: {
                userId,
                listingId
            }
        });
    }

    async removeFavourite(listingId: number, userId: number): Promise<void> {
        const favourite = await this.prisma.favourite.findFirst({
            where: {
                userId,
                listingId
            }
        });

        if (!favourite) {
            throw new NotFoundException('To ogłoszenie nie jest w ulubionych');
        }

        await this.prisma.favourite.delete({
            where: { id: favourite.id }
        });
    }

    async getUserFavourites(userId: number, skip = 0, take = 20) {
        return await this.prisma.favourite.findMany({
            where: {
                userId
            },
            skip: Number(skip),
            take: Number(take),
            include: {
                listing: {
                    include: {
                        category: true,
                        images: true,
                        _count: { select: { views: true, favourites: true } }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async isFavourite(listingId: number, userId: number): Promise<boolean> {
        const favourite = await this.prisma.favourite.findFirst({
            where: {
                userId,
                listingId
            }
        });

        return !!favourite;
    }

    async toggleFavourite(listingId: number, userId: number) {
        const isFav = await this.isFavourite(listingId, userId);

        if (isFav) {
            await this.removeFavourite(listingId, userId);
            return { success: true, action: 'deleted', message: 'Usunięto z ulubionych' };
        } else {
            await this.addFavourite(listingId, userId);
            return { success: true, action: 'added', message: 'Dodano do ulubionych' };
        }
    }

    async getFavouriteCount(listingId: number): Promise<number> {
        return await this.prisma.favourite.count({
            where: {
                listingId
            }
        });
    }
}
