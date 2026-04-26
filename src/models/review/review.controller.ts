import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewService } from './review.service';
import { ReviewMapper } from './review.mapper';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() body: CreateReviewDto, @Req() req: Request) {
    const reviewerId = (req as any).user['id'];
    const review = await this.reviewService.create(body, reviewerId);
    return {
      success: true,
      data: review,
    };
  }

  @Get('user/:userId')
  async getByUserId(@Param('userId') userId: string) {
    const reviews = await this.reviewService.getByUserId(Number(userId));
    return {
      success: true,
      data: reviews?.map(review => ReviewMapper.toGetReview(review)) || [],
      count: reviews?.length || 0,
    };
  }

  @Get('rating/:userId')
  async getUserRating(@Param('userId') userId: string) {
    const { averageRating, reviewCount } = await this.reviewService.getAverageRating(
      Number(userId)
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
  async getByReviewer(@Param('reviewerId') reviewerId: string) {
    const reviews = await this.reviewService.getByReviewer(Number(reviewerId));
    return {
      success: true,
      data: reviews || [],
      count: reviews?.length || 0,
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const review = await this.reviewService.getById(Number(id));
    return {
      success: true,
      data: ReviewMapper.toGetReview(review),
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateReviewDto, @Req() req: Request) {
    const reviewerId = (req as any).user['id'];
    const review = await this.reviewService.update(Number(id), body, reviewerId);
    return {
      success: true,
      data: review,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    const reviewerId = (req as any).user['id'];
    await this.reviewService.delete(Number(id), reviewerId);
    return {
      success: true,
      message: 'Recenzja została usunięta',
    };
  }
}
