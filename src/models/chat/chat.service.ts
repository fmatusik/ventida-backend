import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { AuthUser } from '../../common/roles';
import { PUBLIC_USER_SELECT } from '../../common/user-select';

const CHAT_INCLUDE = {
  user: { select: PUBLIC_USER_SELECT },
  listing: {
    include: {
      user: { select: PUBLIC_USER_SELECT },
      images: { orderBy: { position: 'asc' } },
    },
  },
} satisfies Prisma.ChatInclude;

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateChatDto, userId: number) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: data.listingId },
    });
    if (!listing) {
      throw new NotFoundException(`Ogłoszenie o ID ${data.listingId} nie znalezione`);
    }
    if (listing.userId === userId) {
      throw new BadRequestException('Nie możesz utworzyć czatu do własnego ogłoszenia');
    }

    return this.prisma.chat.upsert({
      where: { userId_listingId: { userId, listingId: data.listingId } },
      create: { userId, listingId: data.listingId },
      update: {},
      include: { ...CHAT_INCLUDE, messages: true },
    });
  }

  async getChatsByUserId(userId: number) {
    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [{ userId }, { listing: { userId } }],
      },
      include: {
        ...CHAT_INCLUDE,
        messages: { orderBy: { created_at: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    // Liczba nieprzeczytanych wiadomości od drugiej strony w każdej rozmowie
    const unread = await this.prisma.message.groupBy({
      by: ['chatId'],
      where: {
        chatId: { in: chats.map((c) => c.id) },
        is_read: false,
        senderId: { not: userId },
      },
      _count: { _all: true },
    });
    const unreadByChat = new Map(unread.map((u) => [u.chatId, u._count._all]));

    return chats
      .map((c) => ({ ...c, unreadCount: unreadByChat.get(c.id) ?? 0 }))
      .sort((a, b) => {
        // najnowsza aktywność na górze
        const at = a.messages[0]?.created_at ?? a.created_at;
        const bt = b.messages[0]?.created_at ?? b.created_at;
        return bt.getTime() - at.getTime();
      });
  }

  /** Lista rozmów do ogłoszenia - tylko dla jego właściciela. */
  async getChatsByListingId(listingId: number, user: AuthUser) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Ogłoszenie nie znalezione');
    if (listing.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Brak uprawnień');
    }
    return this.prisma.chat.findMany({
      where: { listingId },
      include: {
        ...CHAT_INCLUDE,
        messages: { orderBy: { created_at: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getById(id: number, user: AuthUser) {
    const chat = await this.prisma.chat.findUnique({
      where: { id },
      include: { ...CHAT_INCLUDE, messages: { orderBy: { created_at: 'asc' } } },
    });
    if (!chat) throw new NotFoundException(`Chat o ID ${id} nie znaleziony`);
    if (chat.userId !== user.id && chat.listing.userId !== user.id) {
      // 404 zamiast 403 - nie zdradzamy istnienia cudzych rozmów
      throw new NotFoundException(`Chat o ID ${id} nie znaleziony`);
    }
    return chat;
  }

  async delete(id: number, user: AuthUser): Promise<void> {
    const chat = await this.prisma.chat.findUnique({ where: { id } });
    if (!chat) throw new NotFoundException(`Chat o ID ${id} nie znaleziony`);
    if (chat.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Brak uprawnień do usunięcia tego czatu');
    }
    await this.prisma.chat.delete({ where: { id } });
  }
}
