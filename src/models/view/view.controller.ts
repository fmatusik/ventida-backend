import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ViewService } from './view.service';
import { CreateViewDto } from './dto/create-view.dto';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../../common/roles';
import { safeSkip, safeTake } from '../../common/pagination';

@Controller('view')
export class ViewController {
  constructor(private readonly viewService: ViewService) {}

  // Działa dla zalogowanych i anonimowych (token opcjonalny)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  async recordView(@Body() body: CreateViewDto, @CurrentUser() user?: AuthUser) {
    const res = await this.viewService.recordView(body.listingId, user?.id);
    return { success: true, data: res };
  }

  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('anonymous')
  async recordAnonymousView(@Body() body: CreateViewDto) {
    const res = await this.viewService.recordView(body.listingId);
    return { success: true, data: res };
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  async getUserViews(
    @CurrentUser() user: AuthUser,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const views = await this.viewService.getUserViews(user.id, safeSkip(skip), safeTake(take, 50));
    return { success: true, data: views, count: views.length };
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/listings/total')
  async getTotalViewsForUserListings(@CurrentUser() user: AuthUser) {
    const totalViews = await this.viewService.getTotalViewsForUserListings(user.id);
    return { success: true, data: { totalViews } };
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/listing/:listingId')
  async getUserListingViewCount(
    @Param('listingId', ParseIntPipe) listingId: number,
    @CurrentUser() user: AuthUser,
  ) {
    const count = await this.viewService.getUserListingViewCount(listingId, user.id);
    return { success: true, data: { count } };
  }

  @Get('listing/:listingId/count')
  async getListingViewsCount(@Param('listingId', ParseIntPipe) listingId: number) {
    const count = await this.viewService.getListingViewsCount(listingId);
    return { success: true, data: { count } };
  }

  @UseGuards(JwtAuthGuard)
  @Get('listing/:listingId')
  async getListingViews(
    @Param('listingId', ParseIntPipe) listingId: number,
    @CurrentUser() user: AuthUser,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const views = await this.viewService.getListingViews(
      listingId,
      user,
      safeSkip(skip),
      safeTake(take, 50),
    );
    return { success: true, data: views, count: views.length };
  }
}
