import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

@Controller('attribute')
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

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
  async getByCategoryId(@Param('categoryId') categoryId: string) {
    const attributes = await this.attributeService.getByCategoryId(Number(categoryId));
    return {
      success: true,
      data: attributes,
      count: attributes.length,
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const attribute = await this.attributeService.getById(Number(id));
    return {
      success: true,
      data: attribute,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateAttributeDto) {
    const attribute = await this.attributeService.update(Number(id), body);
    return {
      success: true,
      data: attribute,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.attributeService.delete(Number(id));
    return {
      success: true,
      message: 'Atrybut został usunięty',
    };
  }
}
