import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { AuthUser } from '../../common/roles';

@Injectable()
export class AttributeValueService {
  constructor(private prisma: PrismaService) {}

  private async assertListingOwner(listingId: number, user: AuthUser) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
    });
    if (!listing) throw new NotFoundException(`Ogłoszenie o ID ${listingId} nie znalezione`);
    if (listing.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Brak uprawnień do tego ogłoszenia');
    }
  }

  async create(data: CreateAttributeValueDto, user: AuthUser) {
    const attribute = await this.prisma.attribute.findUnique({
      where: { id: data.attributeId },
    });
    if (!attribute) {
      throw new NotFoundException(`Atrybut o ID ${data.attributeId} nie znaleziony`);
    }
    await this.assertListingOwner(data.listingId, user);

    return this.prisma.attributeValue.create({
      data,
      include: { attribute: true },
    });
  }

  getByListingId(listingId: number) {
    return this.prisma.attributeValue.findMany({
      where: { listingId },
      include: { attribute: true },
    });
  }

  async getById(id: number) {
    const attributeValue = await this.prisma.attributeValue.findUnique({
      where: { id },
      include: { attribute: true },
    });
    if (!attributeValue) {
      throw new NotFoundException(`Wartość atrybutu o ID ${id} nie znaleziona`);
    }
    return attributeValue;
  }

  async update(id: number, data: UpdateAttributeValueDto, user: AuthUser) {
    const existing = await this.getById(id);
    await this.assertListingOwner(existing.listingId, user);
    return this.prisma.attributeValue.update({
      where: { id },
      data: { value: data.value },
      include: { attribute: true },
    });
  }

  async delete(id: number, user: AuthUser): Promise<void> {
    const existing = await this.getById(id);
    await this.assertListingOwner(existing.listingId, user);
    await this.prisma.attributeValue.delete({ where: { id } });
  }
}
