import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../../common/roles';
import { FavouriteService } from './favourite.service';
import { safeSkip, safeTake } from '../../common/pagination';

@Controller('favourite')
export class FavouriteController {
  constructor(private readonly favouriteService: FavouriteService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':listingId')
  async addFavourite(@Param('listingId', ParseIntPipe) listingId: number, @CurrentUser() user: AuthUser) {
    const userId = user.id;
    const favourite = await this.favouriteService.addFavourite(listingId, userId);
    return {
      success: true,
      data: favourite,
      message: 'Dodano do ulubionych',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':listingId')
  async removeFavourite(@Param('listingId', ParseIntPipe) listingId: number, @CurrentUser() user: AuthUser) {
    const userId = user.id;
    await this.favouriteService.removeFavourite(listingId, userId);
    return {
      success: true,
      message: 'Usunięto z ulubionych',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':listingId/toggle')
  async toggleFavourite(@Param('listingId', ParseIntPipe) listingId: number, @CurrentUser() user: AuthUser) {
    const userId = user.id;
    const result = await this.favouriteService.toggleFavourite(listingId, userId);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserFavourites(
    @CurrentUser() user: AuthUser,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const userId = user.id;
    const favourites = await this.favouriteService.getUserFavourites(userId, safeSkip(skip), safeTake(take));
    return {
      success: true,
      data: favourites,
      count: favourites.length,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':listingId/check')
  async isFavourite(@Param('listingId', ParseIntPipe) listingId: number, @CurrentUser() user: AuthUser) {
    const userId = user.id;
    const isFav = await this.favouriteService.isFavourite(listingId, userId);
    return {
      success: true,
      data: {
        isFavourite: isFav,
      },
    };
  }

  @Get(':listingId/count')
  async getFavouriteCount(@Param('listingId', ParseIntPipe) listingId: number) {
    const count = await this.favouriteService.getFavouriteCount(listingId);
    return {
      success: true,
      data: {
        count,
      },
    };
  }
}
