import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ViewService } from './view.service';
import { CreateViewDto } from './dto/create-view.dto';

@Controller('view')
export class ViewController {
  constructor(private readonly viewService: ViewService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async recordView(@Body() body: CreateViewDto, @Req() req: Request) {
    const userId = (req as any).user?.['id'];
    const view = await this.viewService.recordView(body.listingId, userId);
    return {
      success: true,
      data: view,
      message: 'Widok został zapisany',
    };
  }

  @Post('anonymous')
  async recordAnonymousView(@Body() body: CreateViewDto) {
    const view = await this.viewService.recordView(body.listingId, null as any);
    return {
      success: true,
      data: view,
      message: 'Anonimowy widok został zapisany',
    };
  }

  @Get('listing/:listingId/count')
  async getListingViewsCount(@Param('listingId') listingId: string) {
    const count = await this.viewService.getListingViewsCount(Number(listingId));
    return {
      success: true,
      data: {
        count,
      },
    };
  }

  @Get('listing/:listingId')
  async getListingViews(
    @Param('listingId') listingId: string,
    @Query('skip') skip = 0,
    @Query('take') take = 50,
  ) {
    const views = await this.viewService.getListingViews(Number(listingId), skip, take);
    return {
      success: true,
      data: views,
      count: views.length,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user')
  async getUserViews(@Req() req: Request, @Query('skip') skip = 0, @Query('take') take = 50) {
    const userId = (req as any).user['id'];
    const views = await this.viewService.getUserViews(userId, skip, take);
    return {
      success: true,
      data: views,
      count: views.length,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user/listings/total')
  async getTotalViewsForUserListings(@Req() req: Request) {
    const userId = (req as any).user['id'];
    const totalViews = await this.viewService.getTotalViewsForUserListings(userId);
    return {
      success: true,
      data: {
        totalViews,
      },
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user/listing/:listingId')
  async getUserListingViewCount(@Param('listingId') listingId: string, @Req() req: Request) {
    const userId = (req as any).user['id'];
    const count = await this.viewService.getUserListingViewCount(Number(listingId), userId);
    return {
      success: true,
      data: {
        count,
      },
    };
  }
}
