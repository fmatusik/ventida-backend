import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto, UpdateUserDto } from './dto/update-user.dto';
import { PUBLIC_USER_SELECT, SELF_USER_SELECT } from '../../common/user-select';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const password = await bcrypt.hash(data.password, 12);
    try {
      return await this.prisma.user.create({
        data: { email: data.email, password, username: data.username },
        select: { id: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = String((error.meta as any)?.target ?? '');
        if (target.includes('username')) {
          throw new ConflictException('Ta nazwa użytkownika jest już zajęta.');
        }
        throw new ConflictException('Konto z tym adresem e-mail już istnieje.');
      }
      throw new InternalServerErrorException(
        'Wystąpił błąd przy tworzeniu użytkownika.',
      );
    }
  }

  /** Wyłącznie do logowania - zawiera hash hasła, nie zwracać na zewnątrz! */
  async getByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  /** Dane właściciela konta (bez hasła). */
  async getSelf(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SELF_USER_SELECT,
    });
    if (!user) throw new NotFoundException('Nie znaleziono użytkownika');
    return user;
  }

  async getByIdForAccountDetails(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...SELF_USER_SELECT,
        _count: { select: { reviewsTaken: true } },
      },
    });
    if (!user) return null;

    const agg = await this.prisma.review.aggregate({
      where: { reviewed_user_id: id },
      _avg: { rating: true },
    });

    return { user, avgRating: agg._avg.rating ?? 0 };
  }

  async update(id: number, data: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: SELF_USER_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ta nazwa użytkownika jest już zajęta.');
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Nie znaleziono użytkownika');
      }
      throw new BadRequestException(
        'Wystąpił błąd przy aktualizacji użytkownika.',
      );
    }
  }

  async updatePassword(id: number, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Użytkownik nie znaleziony');

    // Konta bez hasła (np. logowanie Google) mogą ustawić je bez podawania starego
    if (user.password) {
      const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
      if (!isMatch) throw new BadRequestException('Obecne hasło jest niepoprawne');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    return { success: true };
  }

  /** Publiczne wyszukiwanie - tylko po nazwie użytkownika/imieniu, bez e-maila. */
  async search(query: string) {
    const q = (query ?? '').trim().slice(0, 50);
    if (!q) return [];
    return this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { surname: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        ...PUBLIC_USER_SELECT,
        _count: { select: { reviewsTaken: true } },
      },
      take: 20,
    });
  }

  async delete(id: number) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      throw new NotFoundException('Nie znaleziono użytkownika');
    }
  }
}
