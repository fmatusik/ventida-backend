import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ListingService } from './listing.service';
import { ListingMapper } from './listing.mapper';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { CreateListingImageDto } from '../listing-image/dto/create-listing-image.dto';

@Controller('listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() body: CreateListingDto, @Req() req: Request) {
    const userId = (req as any).user['id'];
    const listing = await this.listingService.create(body, userId);
    return {
      success: true,
      data: listing,
    };
  }

  @Get()
  async getAll(
    @Query('skip') skip = 0,
    @Query('take') take = 20,
    @Query('categoryId') categoryId?: number,
    @Query('q') query?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('location') location?: string,
  ) {
    const listings = await this.listingService.getAll(
        Number(skip), 
        Number(take), 
        categoryId ? Number(categoryId) : undefined, 
        query, 
        minPrice ? Number(minPrice) : undefined, 
        maxPrice ? Number(maxPrice) : undefined, 
        location
    );
    const mappedListings = listings.map(listing => ListingMapper.toShortListingSummary(listing as any));
    return {
      success: true,
      data: mappedListings,
      count: mappedListings.length,
    };
  }

  @Get('search')
  async search(@Query('q') query: string, @Query('skip') skip = 0, @Query('take') take = 20) {
    if (!query) {
      throw new NotFoundException('Brakuje parametru query');
    }
    const listings = await this.listingService.search(query, skip, take);
    return {
      success: true,
      data: listings,
      count: listings.length,
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const listing = await this.listingService.getById(Number(id));
    return {
      success: true,
      data: listing,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateListingDto, @Req() req: Request) {
    const userId = (req as any).user['id'];
    const listing = await this.listingService.update(Number(id), body, userId);
    return {
      success: true,
      data: listing,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user['id'];
    await this.listingService.delete(Number(id), userId);
    return {
      success: true,
      message: 'Ogłoszenie zostało usunięte',
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/image')
  async addImage(@Param('id') id: string, @Body() body: CreateListingImageDto) {
    const image = await this.listingService.addImage(Number(id), body.url, body.position);
    return {
      success: true,
      data: image,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/image/:imageId')
  async deleteImage(@Param('imageId') imageId: string) {
    await this.listingService.deleteImage(Number(imageId));
    return {
      success: true,
      message: 'Zdjęcie zostało usunięte',
    };
  }
}
