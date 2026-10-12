import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  /** Sprawdza, że użytkownik jest stroną rozmowy (kupującym lub właścicielem ogłoszenia). */
  private async assertParticipant(chatId: number, userId: number) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { listing: { select: { userId: true } } },
    });
    if (!chat || (chat.userId !== userId && chat.listing.userId !== userId)) {
      throw new NotFoundException(`Chat o ID ${chatId} nie znaleziony`);
    }
    return chat;
  }

  private async getOwnedMessage(id: number, userId: number) {
    const message = await this.prisma.message.findUnique({ where: { id } });
    if (!message) throw new NotFoundException(`Wiadomość o ID ${id} nie znaleziona`);
    await this.assertParticipant(message.chatId, userId);
    return message;
  }

  async create(data: CreateMessageDto, userId: number) {
    await this.assertParticipant(data.chatId, userId);
    return this.prisma.message.create({
      data: { message: data.message, chatId: data.chatId, senderId: userId },
    });
  }

  async getMessagesByChatId(chatId: number, userId: number, skip = 0, take = 50) {
    await this.assertParticipant(chatId, userId);
    return this.prisma.message.findMany({
      where: { chatId },
      skip,
      take,
      orderBy: { created_at: 'asc' },
    });
  }

  async getById(id: number, userId: number) {
    return this.getOwnedMessage(id, userId);
  }

  async update(id: number, data: UpdateMessageDto, userId: number) {
    const message = await this.getOwnedMessage(id, userId);
    if (message.senderId !== userId) {
      throw new ForbiddenException('Możesz edytować tylko własne wiadomości');
    }
    return this.prisma.message.update({ where: { id }, data: { message: data.message } });
  }

  /** Wiadomość oznacza jako przeczytaną odbiorca, nie nadawca. */
  async markAsRead(id: number, userId: number) {
    const message = await this.getOwnedMessage(id, userId);
    if (message.senderId === userId) return message;
    return this.prisma.message.update({ where: { id }, data: { is_read: true } });
  }

  async delete(id: number, userId: number): Promise<void> {
    const message = await this.getOwnedMessage(id, userId);
    if (message.senderId !== userId) {
      throw new ForbiddenException('Możesz usuwać tylko własne wiadomości');
    }
    await this.prisma.message.delete({ where: { id } });
  }

  async markChatMessagesAsRead(chatId: number, userId: number): Promise<void> {
    await this.assertParticipant(chatId, userId);
    await this.prisma.message.updateMany({
      where: { chatId, is_read: false, senderId: { not: userId } },
      data: { is_read: true },
    });
  }

  async getUnreadMessagesCount(chatId: number, userId: number): Promise<number> {
    await this.assertParticipant(chatId, userId);
    return this.prisma.message.count({
      where: { chatId, is_read: false, senderId: { not: userId } },
    });
  }
}
