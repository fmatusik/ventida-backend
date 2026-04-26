import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    try {
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 12);
      }

      return await this.prisma.user.create({ data });
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new BadRequestException('Email już istnieje w bazie danych.');
      }

      throw new InternalServerErrorException('Wystąpił błąd przy tworzeniu użytkownika.');
    }
  }

  async getByEmail(email) {
    return await this.prisma.user.findUnique({
      where: { email: email },
    });
  }

  async getById(id) {
    return await this.prisma.user.findUnique({
      where: {id: id},
      include: {
        reviewsTaken: true,
      },
    });
  }

  async getByIdForAccountDetails(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { reviewsTaken: true } } }
    });

    if (!user) return null;

    const agg = await this.prisma.review.aggregate({
      where: { reviewed_user_id: id },
      _avg: { rating: true },
    });

    return { user, avgRating: agg._avg.rating ?? 0 };
  }

  async update(id: number, data: any) {
    try {
      const { password, email, createdAt, id: _, reviews, rating, ...updateData } = data;
      
      return await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Wystąpił błąd przy aktualizacji użytkownika.');
    }
  }

  async updatePassword(id: number, oldPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Użytkownik nie znaleziony');

    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch) throw new BadRequestException('Obecne hasło jest niepoprawne');

    const hashedPassword = await bcrypt.hash(newPass, 12);
    return await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async search(query: string) {
    return await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { email: { contains: query } },
          { name: { contains: query } },
          { surname: { contains: query } },
        ],
      },
      include: {
        _count: {
          select: { reviewsTaken: true }
        }
      },
      take: 20,
    });
  }

  async delete(id: number) {
    try {
      return await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      throw new BadRequestException('Błąd przy usuwaniu użytkownika.');
    }
  }
}
