import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../../common/roles';
import { ReviewService } from './review.service';
import { ReviewMapper } from './review.mapper';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: CreateReviewDto, @CurrentUser() user: AuthUser) {
    const reviewerId = user.id;
    const review = await this.reviewService.create(body, reviewerId);
    return {
      success: true,
      data: review,
    };
  }

  @Get('user/:userId')
  async getByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const reviews = await this.reviewService.getByUserId(userId);
    return {
      success: true,
      data: reviews?.map(review => ReviewMapper.toGetReview(review)) || [],
      count: reviews?.length || 0,
    };
  }

  @Get('rating/:userId')
  async getUserRating(@Param('userId', ParseIntPipe) userId: number) {
    const { averageRating, reviewCount } = await this.reviewService.getAverageRating(
      userId
    );
    return {
      success: true,
      data: {
        averageRating,
        reviewCount,
      },
    };
  }

  @Get('reviewer/:reviewerId')
  async getByReviewer(@Param('reviewerId', ParseIntPipe) reviewerId: number) {
    const reviews = await this.reviewService.getByReviewer(reviewerId);
    return {
      success: true,
      data: reviews || [],
      count: reviews?.length || 0,
    };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const review = await this.reviewService.getById(id);
    return {
      success: true,
      data: ReviewMapper.toGetReview(review),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateReviewDto, @CurrentUser() user: AuthUser) {
    const reviewerId = user.id;
    const review = await this.reviewService.update(id, body, reviewerId);
    return {
      success: true,
      data: review,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    const reviewerId = user.id;
    await this.reviewService.delete(id, reviewerId);
    return {
      success: true,
      message: 'Recenzja została usunięta',
    };
  }
}
