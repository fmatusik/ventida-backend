import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AttributeValueService } from './attribute-value.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';

@Controller('attribute-value')
export class AttributeValueController {
  constructor(private readonly attributeValueService: AttributeValueService) {}

  @Post()
  async create(@Body() body: CreateAttributeValueDto) {
    const attributeValue = await this.attributeValueService.create(body);
    return {
      success: true,
      data: attributeValue,
    };
  }

  @Get('listing/:listingId')
  async getByListingId(@Param('listingId') listingId: string) {
    const attributeValues = await this.attributeValueService.getByListingId(Number(listingId));
    return {
      success: true,
      data: attributeValues,
      count: attributeValues.length,
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const attributeValue = await this.attributeValueService.getById(Number(id));
    return {
      success: true,
      data: attributeValue,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateAttributeValueDto) {
    const attributeValue = await this.attributeValueService.update(Number(id), body);
    return {
      success: true,
      data: attributeValue,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.attributeValueService.delete(Number(id));
    return {
      success: true,
      message: 'Wartość atrybutu została usunięta',
    };
  }
}
