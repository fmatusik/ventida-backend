import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAttributeDto } from "./dto/create-attribute.dto";
import { UpdateAttributeDto } from "./dto/update-attribute.dto";
import { Attribute } from "@prisma/client";

@Injectable()
export class AttributeService {
    constructor(private prisma: PrismaService) {}

    async create(data: CreateAttributeDto): Promise<Attribute> {
        // Sprawdzenie czy kategoria istnieje
        const category = await this.prisma.category.findUnique({
            where: { id: data.categoryId }
        });

        if (!category) {
            throw new NotFoundException(`Kategoria o ID ${data.categoryId} nie znaleziona`);
        }

        return await this.prisma.attribute.create({
            data,
            include: {
                category: true,
                values: true
            }
        });
    }

    async getAll() {
        return await this.prisma.attribute.findMany({
            include: {
                category: true,
                values: true
            },
            orderBy: { name: 'asc' }
        });
    }

    async getByCategoryId(categoryId: number) {
        return await this.prisma.attribute.findMany({
            where: { categoryId },
            include: {
                category: true,
                values: true
            },
            orderBy: { name: 'asc' }
        });
    }

    async getById(id: number): Promise<Attribute> {
        const attribute = await this.prisma.attribute.findUnique({
            where: { id },
            include: {
                category: true,
                values: true
            }
        });

        if (!attribute) {
            throw new NotFoundException(`Atrybut o ID ${id} nie znaleziony`);
        }

        return attribute;
    }

    async update(id: number, data: UpdateAttributeDto): Promise<Attribute> {
        const attribute = await this.prisma.attribute.findUnique({ where: { id } });

        if (!attribute) {
            throw new NotFoundException(`Atrybut o ID ${id} nie znaleziony`);
        }

        return await this.prisma.attribute.update({
            where: { id },
            data,
            include: {
                category: true,
                values: true
            }
        });
    }

    async delete(id: number): Promise<void> {
        const attribute = await this.prisma.attribute.findUnique({ where: { id } });

        if (!attribute) {
            throw new NotFoundException(`Atrybut o ID ${id} nie znaleziony`);
        }

        await this.prisma.attribute.delete({ where: { id } });
    }
}
