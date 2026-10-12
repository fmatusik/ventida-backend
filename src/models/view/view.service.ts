import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/roles';

const DEDUPE_WINDOW_MS = 60 * 60 * 1000;

@Injectable()
export class ViewService {
  constructor(private prisma: PrismaService) {}

  /**
   * Zapisuje wyświetlenie. Własne wyświetlenia właściciela i powtórne wyświetlenia
   * tego samego zalogowanego użytkownika w ciągu godziny nie są liczone.
   * Wyświetlenia anonimowe są ograniczone przez rate limit na poziomie endpointu.
   */
  async recordView(listingId: number, userId?: number) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, userId: true },
    });
    if (!listing) {
      throw new NotFoundException(`Ogłoszenie o ID ${listingId} nie znalezione`);
    }
    if (userId && listing.userId === userId) return { counted: false };

    if (userId) {
      const recent = await this.prisma.view.findFirst({
        where: {
          listingId,
          userId,
          created_at: { gt: new Date(Date.now() - DEDUPE_WINDOW_MS) },
        },
        select: { id: true },
      });
      if (recent) return { counted: false };
    }

    await this.prisma.view.create({ data: { listingId, userId: userId ?? null } });
    return { counted: true };
  }

  getListingViewsCount(listingId: number) {
    return this.prisma.view.count({ where: { listingId } });
  }

  /** Lista widzów - tylko dla właściciela ogłoszenia (i admina), bez danych kontaktowych. */
  async getListingViews(listingId: number, user: AuthUser, skip = 0, take = 50) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
    });
    if (!listing) throw new NotFoundException('Ogłoszenie nie znalezione');
    if (listing.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Brak uprawnień');
    }
    return this.prisma.view.findMany({
      where: { listingId },
      skip,
      take,
      select: {
        id: true,
        created_at: true,
        user: { select: { id: true, username: true } },
      },
      orderBy: { id: 'desc' },
    });
  }

  getUserViews(userId: number, skip = 0, take = 50) {
    return this.prisma.view.findMany({
      where: { userId },
      skip,
      take,
      include: { listing: { include: { category: true, images: true } } },
      orderBy: { id: 'desc' },
    });
  }

  getUserListingViewCount(listingId: number, userId: number) {
    return this.prisma.view.count({ where: { listingId, userId } });
  }

  getTotalViewsForUserListings(userId: number) {
    return this.prisma.view.count({ where: { listing: { userId } } });
  }
}
