import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ListingService } from './listing.service';
import { ListingMapper } from './listing.mapper';
import { CreateListingDto, ListingImageDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../../common/roles';
import { safeSkip, safeTake } from '../../common/pagination';

const optionalNumber = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

@Controller('listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  // 20 ogłoszeń na godzinę na IP - chroni przed zaśmiecaniem serwisu
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: CreateListingDto, @CurrentUser() user: AuthUser) {
    const listing = await this.listingService.create(body, user.id);
    return { success: true, data: listing };
  }

  @Get()
  async getAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('categoryId') categoryId?: string,
    @Query('q') query?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('location') location?: string,
  ) {
    const listings = await this.listingService.getAll(
      safeSkip(skip),
      safeTake(take),
      optionalNumber(categoryId),
      typeof query === 'string' ? query.trim().slice(0, 100) || undefined : undefined,
      optionalNumber(minPrice),
      optionalNumber(maxPrice),
      typeof location === 'string' ? location.trim().slice(0, 100) || undefined : undefined,
    );
    const data = listings.map((l) => ListingMapper.toShortListingSummary(l));
    return { success: true, data, count: data.length };
  }

  @Get('search')
  async search(
    @Query('q') query?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const q = typeof query === 'string' ? query.trim().slice(0, 100) : '';
    const listings = await this.listingService.getAll(
      safeSkip(skip),
      safeTake(take),
      undefined,
      q || undefined,
    );
    const data = listings.map((l) => ListingMapper.toShortListingSummary(l));
    return { success: true, data, count: data.length };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const listing = await this.listingService.getById(id);
    return { success: true, data: listing };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateListingDto,
    @CurrentUser() user: AuthUser,
  ) {
    const listing = await this.listingService.update(id, body, user);
    return { success: true, data: listing };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    await this.listingService.delete(id, user);
    return { success: true, message: 'Ogłoszenie zostało usunięte' };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/image')
  async addImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ListingImageDto,
    @CurrentUser() user: AuthUser,
  ) {
    const image = await this.listingService.addImage(id, body.url, body.position, user);
    return { success: true, data: image };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/image/:imageId')
  async deleteImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() user: AuthUser,
  ) {
    await this.listingService.deleteImage(id, imageId, user);
    return { success: true, message: 'Zdjęcie zostało usunięte' };
  }
}
