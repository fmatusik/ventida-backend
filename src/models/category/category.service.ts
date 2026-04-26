import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { Category } from "@prisma/client";

@Injectable()
export class CategoryService {
    constructor(private prisma: PrismaService) {}

    async create(data: CreateCategoryDto): Promise<Category> {
        // Sprawdzenie czy slug jest unikalny
        const existingCategory = await this.prisma.category.findUnique({
            where: { slug: data.slug }
        });

        if (existingCategory) {
            throw new BadRequestException('Kategoria z takim slug\'iem już istnieje');
        }

        // Jeśli parent_id jest podane, sprawdzenie głębokości (max 3 poziomy)
        if (data.parent_id) {
            const parent = await this.prisma.category.findUnique({
                where: { id: data.parent_id },
                include: { parent: { include: { parent: true } } }
            });

            if (!parent) {
                throw new NotFoundException(`Kategoria nadrzędna o ID ${data.parent_id} nie znaleziona`);
            }

            // parent to poziom 1 (root), child to poziom 2. Jeśli parent ma parenta, to parent jest poziomem 2, child będzie 3.
            // Jeśli parent ma parenta który ma parenta, to parent jest poziomem 3, nie pozwalamy na child (poziom 4).
            if (parent.parent && parent.parent.parent_id) {
                throw new BadRequestException('Przekroczono maksymalną głębokość kategorii (max 3 poziomy)');
            }
        }

        return await this.prisma.category.create({
            data,
            include: {
                children: true,
                attributes: true
            }
        });
    }

    async getAll() {
        return await this.prisma.category.findMany({
            include: {
                children: {
                    orderBy: { position: 'asc' }
                },
                attributes: true,
                listings: {
                    select: {
                        id: true
                    }
                }
            },
            orderBy: { position: 'asc' }
        });
    }

    async getRootCategories() {
        return await this.prisma.category.findMany({
            where: {
                parent_id: null
            },
            include: {
                children: {
                    include: {
                        children: {
                            orderBy: { position: 'asc' }
                        }
                    },
                    orderBy: { position: 'asc' }
                },
                attributes: true
            },
            orderBy: { position: 'asc' }
        });
    }

    async getById(id: number): Promise<Category> {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                children: {
                    orderBy: { position: 'asc' }
                },
                parent: true,
                attributes: true,
                listings: true
            }
        });

        if (!category) {
            throw new NotFoundException(`Kategoria o ID ${id} nie znaleziona`);
        }

        return category;
    }

    async getBySlug(slug: string): Promise<Category> {
        const category = await this.prisma.category.findUnique({
            where: { slug },
            include: {
                children: {
                    orderBy: { position: 'asc' }
                },
                parent: true,
                attributes: true
            }
        });

        if (!category) {
            throw new NotFoundException(`Kategoria ze slug\'iem "${slug}" nie znaleziona`);
        }

        return category;
    }

    async update(id: number, data: UpdateCategoryDto): Promise<Category> {
        const category = await this.prisma.category.findUnique({ where: { id } });

        if (!category) {
            throw new NotFoundException(`Kategoria o ID ${id} nie znaleziona`);
        }

        // Jeśli zmienia się slug, sprawdzić unikalność
        if (data.slug && data.slug !== category.slug) {
            const existingCategory = await this.prisma.category.findUnique({
                where: { slug: data.slug }
            });

            if (existingCategory) {
                throw new BadRequestException('Kategoria z takim slug\'iem już istnieje');
            }
        }

        return await this.prisma.category.update({
            where: { id },
            data,
            include: {
                children: {
                    orderBy: { position: 'asc' }
                },
                attributes: true
            }
        });
    }

    async delete(id: number): Promise<void> {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                children: true,
                listings: true
            }
        });

        if (!category) {
            throw new NotFoundException(`Kategoria o ID ${id} nie znaleziona`);
        }

        if (category.children.length > 0) {
            throw new BadRequestException('Nie można usunąć kategorii, która ma podkategorie');
        }

        if (category.listings.length > 0) {
            throw new BadRequestException('Nie można usunąć kategorii, która ma ogłoszenia');
        }

        await this.prisma.category.delete({ where: { id } });
    }

    async getChildren(parentId: number) {
        return await this.prisma.category.findMany({
            where: {
                parent_id: parentId
            },
            include: {
                children: {
                    orderBy: { position: 'asc' }
                },
                attributes: true
            },
            orderBy: { position: 'asc' }
        });
    }

    async getTrendingCategories(limit = 6) {
        const categories = await this.prisma.category.findMany({
            include: {
                _count: {
                    select: { listings: true }
                },
                listings: {
                    where: {
                        created_at: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                    },
                    select: { id: true }
                }
            },
            orderBy: {
                listings: {
                    _count: 'desc'
                }
            },
            take: limit
        });

        return categories.map(cat => {
            const total = cat._count.listings;
            const recent = cat.listings.length;
            // Obliczamy wzrost jako procent nowych ofert w stosunku do wszystkich
            // Jeśli brak ofert, 0%
            const percentage = total > 0 ? Math.round((recent / total) * 100) : 0;
            
            return {
                ...cat,
                trendingPercentage: percentage,
                listings: undefined // usuwamy listę ID dla oszczędności transferu
            };
        });
    }

    async getAllChildIds(categoryId: number): Promise<number[]> {
        const category = await this.prisma.category.findUnique({
            where: { id: categoryId },
            include: { children: { select: { id: true } } }
        });

        if (!category) return [];

        let ids = [category.id];
        for (const child of category.children) {
            const childIds = await this.getAllChildIds(child.id);
            ids = [...ids, ...childIds];
        }
        return ids;
    }
}
