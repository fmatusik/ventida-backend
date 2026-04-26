import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { UpdateMessageDto } from "./dto/update-message.dto";
import { Message } from "@prisma/client";

@Injectable()
export class MessageService {
    constructor(private prisma: PrismaService) {}

    async create(data: CreateMessageDto, userId: number): Promise<Message> {
        // Sprawdzenie czy chat istnieje
        const chat = await this.prisma.chat.findUnique({
            where: { id: data.chatId }
        });

        if (!chat) {
            throw new NotFoundException(`Chat o ID ${data.chatId} nie znaleziony`);
        }

        return await this.prisma.message.create({
            data: {
                ...data,
                senderId: userId
            },
            include: {
                chat: true
            }
        });
    }

    async getMessagesByChatId(chatId: number, skip = 0, take = 50) {
        return await this.prisma.message.findMany({
            where: {
                chatId
            },
            skip: Number(skip),
            take: Number(take),
            orderBy: { created_at: 'asc' }
        });
    }

    async getById(id: number): Promise<Message> {
        const message = await this.prisma.message.findUnique({
            where: { id },
            include: {
                chat: true
            }
        });

        if (!message) {
            throw new NotFoundException(`Wiadomość o ID ${id} nie znaleziona`);
        }

        return message;
    }

    async update(id: number, data: UpdateMessageDto): Promise<Message> {
        const message = await this.prisma.message.findUnique({ where: { id } });

        if (!message) {
            throw new NotFoundException(`Wiadomość o ID ${id} nie znaleziona`);
        }

        return await this.prisma.message.update({
            where: { id },
            data,
            include: {
                chat: true
            }
        });
    }

    async markAsRead(id: number): Promise<Message> {
        return await this.update(id, { is_read: true });
    }

    async delete(id: number): Promise<void> {
        const message = await this.prisma.message.findUnique({ where: { id } });

        if (!message) {
            throw new NotFoundException(`Wiadomość o ID ${id} nie znaleziona`);
        }

        await this.prisma.message.delete({ where: { id } });
    }

    async markChatMessagesAsRead(chatId: number): Promise<void> {
        await this.prisma.message.updateMany({
            where: {
                chatId,
                is_read: false
            },
            data: {
                is_read: true
            }
        });
    }

    async getUnreadMessagesCount(chatId: number): Promise<number> {
        return await this.prisma.message.count({
            where: {
                chatId,
                is_read: false
            }
        });
    }
}
