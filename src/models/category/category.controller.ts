import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

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
  async getById(@Param('id') id: string) {
    const category = await this.categoryService.getById(Number(id));
    return {
      success: true,
      data: category,
    };
  }

  @Get(':id/children')
  async getChildren(@Param('id') id: string) {
    const children = await this.categoryService.getChildren(Number(id));
    return {
      success: true,
      data: children,
      count: children.length,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
    const category = await this.categoryService.update(Number(id), body);
    return {
      success: true,
      data: category,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.categoryService.delete(Number(id));
    return {
      success: true,
      message: 'Kategoria została usunięta',
    };
  }
}
