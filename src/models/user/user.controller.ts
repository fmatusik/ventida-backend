import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto, UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { UserMapper } from './user.mapper';
import { ListingService } from '../listing/listing.service';
import { ListingMapper } from '../listing/listing.mapper';
import { ReviewService } from '../review/review.service';
import { ReviewMapper } from '../review/review.mapper';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../../common/roles';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly listingService: ListingService,
    private readonly reviewService: ReviewService,
  ) {}

  private assertSelfOrAdmin(user: AuthUser, id: number) {
    if (user.id !== id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Brak uprawnień do tego konta');
    }
  }

  // Rejestracja: 5 kont / godzinę z jednego IP
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @Post()
  async create(@Body() body: CreateUserDto) {
    const user = await this.userService.create(body);
    return { success: true, userId: user.id };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: AuthUser) {
    return this.userService.getSelf(user.id);
  }

  @Get('search')
  async search(@Query('q') query: string) {
    const users = await this.userService.search(query);
    return users.map((user) => UserMapper.toAccountDetails(user, 0));
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() viewer?: AuthUser,
  ) {
    const res = await this.userService.getByIdForAccountDetails(id);
    if (!res) throw new NotFoundException('This user was not found');
    const isPrivileged = !!viewer && (viewer.id === id || viewer.role === Role.ADMIN);
    return UserMapper.toAccountDetails(res.user, res.avgRating, isPrivileged);
  }

  @Get(':id/listings')
  async getUserListingsById(@Param('id', ParseIntPipe) id: number) {
    const res = await this.listingService.getByUserId(id);
    return res.map((listing) => ListingMapper.toShortListingSummary(listing));
  }

  @Get(':id/reviews')
  async getUserReviewsById(@Param('id', ParseIntPipe) id: number) {
    const res = await this.reviewService.getByUserId(id);
    return res.map((review) => ReviewMapper.toGetReview(review));
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    this.assertSelfOrAdmin(user, id);
    return this.userService.update(id, body);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @Put(':id/password')
  async updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePasswordDto,
    @CurrentUser() user: AuthUser,
  ) {
    // Hasło zmienia wyłącznie właściciel konta - także admin musiałby znać stare hasło
    if (user.id !== id) throw new ForbiddenException('Brak uprawnień do tego konta');
    return this.userService.updatePassword(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    this.assertSelfOrAdmin(user, id);
    return this.userService.delete(id);
  }
}
