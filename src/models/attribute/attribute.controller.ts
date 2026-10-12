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
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/roles';
import { AttributeService } from './attribute.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

@Controller('attribute')
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() body: CreateAttributeDto) {
    const attribute = await this.attributeService.create(body);
    return {
      success: true,
      data: attribute,
    };
  }

  @Get()
  async getAll() {
    const attributes = await this.attributeService.getAll();
    return {
      success: true,
      data: attributes,
      count: attributes.length,
    };
  }

  @Get('category/:categoryId')
  async getByCategoryId(@Param('categoryId', ParseIntPipe) categoryId: number) {
    const attributes = await this.attributeService.getByCategoryId(categoryId);
    return {
      success: true,
      data: attributes,
      count: attributes.length,
    };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const attribute = await this.attributeService.getById(id);
    return {
      success: true,
      data: attribute,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateAttributeDto) {
    const attribute = await this.attributeService.update(id, body);
    return {
      success: true,
      data: attribute,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.attributeService.delete(id);
    return {
      success: true,
      message: 'Atrybut został usunięty',
    };
  }
}
