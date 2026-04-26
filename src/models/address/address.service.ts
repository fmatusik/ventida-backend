import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";
import { Address } from "@prisma/client";

@Injectable()
export class AddressService {
    constructor(private prisma: PrismaService) {}

    async create(data: CreateAddressDto, userId: number): Promise<Address> {
        // Sprawdzenie czy użytkownik istnieje
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException(`Użytkownik o ID ${userId} nie istnieje`);
        }

        return await this.prisma.address.create({
            data: {
                ...data,
                userId
            }
        });
    }

    async getUserAddresses(userId: number) {
        return await this.prisma.address.findMany({
            where: { userId },
            orderBy: { id: 'asc' }
        });
    }

    async getById(id: number): Promise<Address> {
        const address = await this.prisma.address.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true
                    }
                }
            }
        });

        if (!address) {
            throw new NotFoundException(`Adres o ID ${id} nie znaleziony`);
        }

        return address;
    }

    async update(id: number, data: UpdateAddressDto, userId: number): Promise<Address> {
        const address = await this.prisma.address.findUnique({ where: { id } });

        if (!address) {
            throw new NotFoundException(`Adres o ID ${id} nie znaleziony`);
        }

        if (address.userId !== userId) {
            throw new BadRequestException('Brak uprawnień do edycji tego adresu');
        }

        return await this.prisma.address.update({
            where: { id },
            data
        });
    }

    async delete(id: number, userId: number): Promise<void> {
        const address = await this.prisma.address.findUnique({ where: { id } });

        if (!address) {
            throw new NotFoundException(`Adres o ID ${id} nie znaleziony`);
        }

        if (address.userId !== userId) {
            throw new BadRequestException('Brak uprawnień do usunięcia tego adresu');
        }

        await this.prisma.address.delete({ where: { id } });
    }

    async getAddressCount(userId: number): Promise<number> {
        return await this.prisma.address.count({
            where: { userId }
        });
    }
}
