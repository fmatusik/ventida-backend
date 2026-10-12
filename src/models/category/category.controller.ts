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
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/roles';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() body: CreateCategoryDto) {
    const category = await this.categoryService.create(body);
    return {
      success: true,
      data: category,
    };
  }

  @Get()
  async getAll() {
    const categories = await this.categoryService.getAll();
    return {
      success: true,
      data: categories,
      count: categories.length,
    };
  }

  @Get('root')
  async getRootCategories() {
    const categories = await this.categoryService.getRootCategories();
    return {
      success: true,
      data: categories,
      count: categories.length,
    };
  }

  @Get('trending')
  async getTrendingCategories(@Query('limit') limit?: number) {
    const categories = await this.categoryService.getTrendingCategories(limit ? Number(limit) : undefined);
    return {
      success: true,
      data: categories,
    };
  }

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const category = await this.categoryService.getBySlug(slug);
    return {
      success: true,
      data: category,
    };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoryService.getById(id);
    return {
      success: true,
      data: category,
    };
  }

  @Get(':id/children')
  async getChildren(@Param('id', ParseIntPipe) id: number) {
    const children = await this.categoryService.getChildren(id);
    return {
      success: true,
      data: children,
      count: children.length,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateCategoryDto) {
    const category = await this.categoryService.update(id, body);
    return {
      success: true,
      data: category,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.delete(id);
    return {
      success: true,
      message: 'Kategoria została usunięta',
    };
  }
}
