import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateChatDto } from "./dto/create-chat.dto";
import { Chat } from "@prisma/client";

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) {}

    async create(data: CreateChatDto, userId: number): Promise<Chat> {
        // Sprawdzenie czy ogłoszenie istnieje
        const listing = await this.prisma.listing.findUnique({
            where: { id: data.listingId }
        });

        if (!listing) {
            throw new NotFoundException(`Ogłoszenie o ID ${data.listingId} nie znalezione`);
        }

        // Sprawdzenie czy użytkownik nie tworzy czatu do własnego ogłoszenia
        if (listing.userId === userId) {
            throw new BadRequestException('Nie możesz utworzyć czatu do własnego ogłoszenia');
        }

        // Sprawdzenie czy taki chat już istnieje
        const existingChat = await this.prisma.chat.findFirst({
            where: {
                userId,
                listingId: data.listingId
            }
        });

        if (existingChat) {
            return existingChat;
        }

        return await this.prisma.chat.create({
            data: {
                ...data,
                userId
            },
            include: {
                user: true,
                listing: true,
                messages: true
            }
        });
    }

    async getChatsByUserId(userId: number) {
        return await this.prisma.chat.findMany({
            where: {
                OR: [
                    { userId: userId }, // Użytkownik jako kupujący
                    { listing: { userId: userId } } // Użytkownik jako sprzedający
                ]
            },
            include: {
                user: true, // Kupujący
                listing: {
                    include: {
                        user: true // Sprzedający
                    }
                },
                messages: {
                    orderBy: { created_at: 'desc' },
                    take: 1
                },
                _count: { select: { messages: true } }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async getChatsByListingId(listingId: number) {
        return await this.prisma.chat.findMany({
            where: {
                listingId
            },
            include: {
                user: true,
                listing: true,
                messages: {
                    orderBy: { created_at: 'desc' },
                    take: 1
                },
                _count: { select: { messages: true } }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async getById(id: number): Promise<Chat> {
        const chat = await this.prisma.chat.findUnique({
            where: { id },
            include: {
                user: true,
                listing: true,
                messages: {
                    orderBy: { created_at: 'asc' }
                }
            }
        });

        if (!chat) {
            throw new NotFoundException(`Chat o ID ${id} nie znaleziony`);
        }

        return chat;
    }

    async delete(id: number, userId: number): Promise<void> {
        const chat = await this.prisma.chat.findUnique({ where: { id } });

        if (!chat) {
            throw new NotFoundException(`Chat o ID ${id} nie znaleziony`);
        }

        if (chat.userId !== userId) {
            throw new BadRequestException('Brak uprawnień do usunięcia tego czatu');
        }

        await this.prisma.chat.delete({ where: { id } });
    }
}
