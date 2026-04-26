import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAttributeValueDto } from "./dto/create-attribute-value.dto";
import { UpdateAttributeValueDto } from "./dto/update-attribute-value.dto";
import { AttributeValue } from "@prisma/client";

@Injectable()
export class AttributeValueService {
    constructor(private prisma: PrismaService) {}

    async create(data: CreateAttributeValueDto): Promise<AttributeValue> {
        // Sprawdzenie czy atrybut istnieje
        const attribute = await this.prisma.attribute.findUnique({
            where: { id: data.attributeId }
        });

        if (!attribute) {
            throw new NotFoundException(`Atrybut o ID ${data.attributeId} nie znaleziony`);
        }

        // Sprawdzenie czy ogłoszenie istnieje
        const listing = await this.prisma.listing.findUnique({
            where: { id: data.listingId }
        });

        if (!listing) {
            throw new NotFoundException(`Ogłoszenie o ID ${data.listingId} nie znalezione`);
        }

        return await this.prisma.attributeValue.create({
            data,
            include: {
                attribute: true,
                listing: true
            }
        });
    }

    async getByListingId(listingId: number) {
        return await this.prisma.attributeValue.findMany({
            where: { listingId },
            include: {
                attribute: true
            }
        });
    }

    async getById(id: number): Promise<AttributeValue> {
        const attributeValue = await this.prisma.attributeValue.findUnique({
            where: { id },
            include: {
                attribute: true,
                listing: true
            }
        });

        if (!attributeValue) {
            throw new NotFoundException(`Wartość atrybutu o ID ${id} nie znaleziona`);
        }

        return attributeValue;
    }

    async update(id: number, data: UpdateAttributeValueDto): Promise<AttributeValue> {
        const attributeValue = await this.prisma.attributeValue.findUnique({ where: { id } });

        if (!attributeValue) {
            throw new NotFoundException(`Wartość atrybutu o ID ${id} nie znaleziona`);
        }

        return await this.prisma.attributeValue.update({
            where: { id },
            data,
            include: {
                attribute: true,
                listing: true
            }
        });
    }

    async delete(id: number): Promise<void> {
        const attributeValue = await this.prisma.attributeValue.findUnique({ where: { id } });

        if (!attributeValue) {
            throw new NotFoundException(`Wartość atrybutu o ID ${id} nie znaleziona`);
        }

        await this.prisma.attributeValue.delete({ where: { id } });
    }

    async deleteByListingId(listingId: number): Promise<void> {
        await this.prisma.attributeValue.deleteMany({
            where: { listingId }
        });
    }
}
