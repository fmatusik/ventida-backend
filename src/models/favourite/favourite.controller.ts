import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FavouriteService } from './favourite.service';

@Controller('favourite')
export class FavouriteController {
  constructor(private readonly favouriteService: FavouriteService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post(':listingId')
  async addFavourite(@Param('listingId') listingId: string, @Req() req: Request) {
    const userId = (req as any).user['id'];
    const favourite = await this.favouriteService.addFavourite(Number(listingId), userId);
    return {
      success: true,
      data: favourite,
      message: 'Dodano do ulubionych',
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':listingId')
  async removeFavourite(@Param('listingId') listingId: string, @Req() req: Request) {
    const userId = (req as any).user['id'];
    await this.favouriteService.removeFavourite(Number(listingId), userId);
    return {
      success: true,
      message: 'Usunięto z ulubionych',
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':listingId/toggle')
  async toggleFavourite(@Param('listingId') listingId: string, @Req() req: Request) {
    const userId = (req as any).user['id'];
    const result = await this.favouriteService.toggleFavourite(Number(listingId), userId);
    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getUserFavourites(
    @Req() req: Request,
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ) {
    const userId = (req as any).user['id'];
    const favourites = await this.favouriteService.getUserFavourites(userId, Number(skip), Number(take));
    return {
      success: true,
      data: favourites,
      count: favourites.length,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':listingId/check')
  async isFavourite(@Param('listingId') listingId: string, @Req() req: Request) {
    const userId = (req as any).user['id'];
    const isFav = await this.favouriteService.isFavourite(Number(listingId), userId);
    return {
      success: true,
      data: {
        isFavourite: isFav,
      },
    };
  }

  @Get(':listingId/count')
  async getFavouriteCount(@Param('listingId') listingId: string) {
    const count = await this.favouriteService.getFavouriteCount(Number(listingId));
    return {
      success: true,
      data: {
        count,
      },
    };
  }
}
