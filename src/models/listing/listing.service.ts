import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryService } from '../category/category.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { AuthUser } from '../../common/roles';
import { PUBLIC_USER_SELECT } from '../../common/user-select';

const LIST_INCLUDE = {
  category: true,
  images: { orderBy: { position: 'asc' } },
  _count: { select: { views: true, favourites: true } },
} satisfies Prisma.ListingInclude;

@Injectable()
export class ListingService {
  constructor(
    private prisma: PrismaService,
    private categoryService: CategoryService,
  ) {}

  private async assertCategoryExists(categoryId: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) throw new BadRequestException('Wybrana kategoria nie istnieje');
  }

  async create(data: CreateListingDto, userId: number) {
    const { images, ...listingData } = data;
    await this.assertCategoryExists(data.categoryId);
    return this.prisma.listing.create({
      data: {
        ...listingData,
        status: listingData.status ?? 'available',
        userId,
        images: images?.length ? { create: images } : undefined,
      },
      include: LIST_INCLUDE,
    });
  }

  async getAll(
    skip = 0,
    take = 20,
    categoryId?: number,
    query?: string,
    minPrice?: number,
    maxPrice?: number,
    location?: string,
  ) {
    const where: Prisma.ListingWhereInput = {
      // archiwalne ogłoszenia nie są wyświetlane na liście publicznej
      status: { not: 'archived' },
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    };
    const and: Prisma.ListingWhereInput[] = [];

    if (categoryId) {
      const categoryIds = await this.categoryService.getAllChildIds(categoryId);
      and.push({ categoryId: { in: categoryIds } });
    }

    if (query) {
      and.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      and.push({
        price: {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
        },
      });
    }

    if (location) {
      and.push({ location: { contains: location, mode: 'insensitive' } });
    }

    return this.prisma.listing.findMany({
      where: { ...where, AND: and },
      skip,
      take,
      include: LIST_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
  }

  async getById(id: number) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        user: { select: PUBLIC_USER_SELECT },
        _count: { select: { views: true, favourites: true, chats: true } },
      },
    });

    if (!listing) {
      throw new NotFoundException(`Ogłoszenie o ID ${id} nie znalezione`);
    }
    return listing;
  }

  async getByUserId(userId: number) {
    return this.prisma.listing.findMany({
      where: { userId },
      include: LIST_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
  }

  /** Zwraca ogłoszenie, jeśli użytkownik jest właścicielem (lub adminem). */
  async assertCanModify(id: number, user: AuthUser) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      throw new NotFoundException(`Ogłoszenie o ID ${id} nie znalezione`);
    }
    if (listing.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Brak uprawnień do tego ogłoszenia');
    }
    return listing;
  }

  async update(id: number, data: UpdateListingDto, user: AuthUser) {
    await this.assertCanModify(id, user);
    const { images, ...listingData } = data;
    if (listingData.categoryId) await this.assertCategoryExists(listingData.categoryId);

    return this.prisma.listing.update({
      where: { id },
      data: {
        ...listingData,
        images: images ? { deleteMany: {}, create: images } : undefined,
      },
      include: LIST_INCLUDE,
    });
  }

  async delete(id: number, user: AuthUser): Promise<void> {
    await this.assertCanModify(id, user);
    await this.prisma.listing.delete({ where: { id } });
  }

  async addImage(listingId: number, url: string, position: number, user: AuthUser) {
    await this.assertCanModify(listingId, user);
    const count = await this.prisma.listingImage.count({ where: { listingId } });
    if (count >= 10) throw new BadRequestException('Maksymalnie 10 zdjęć');
    return this.prisma.listingImage.create({ data: { listingId, url, position } });
  }

  async deleteImage(listingId: number, imageId: number, user: AuthUser): Promise<void> {
    await this.assertCanModify(listingId, user);
    const image = await this.prisma.listingImage.findFirst({
      where: { id: imageId, listingId },
    });
    if (!image) throw new NotFoundException(`Zdjęcie o ID ${imageId} nie znalezione`);
    await this.prisma.listingImage.delete({ where: { id: imageId } });
  }
}
