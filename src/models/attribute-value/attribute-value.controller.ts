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
import { AttributeValueService } from './attribute-value.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';

@Controller('attribute-value')
export class AttributeValueController {
  constructor(private readonly attributeValueService: AttributeValueService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: CreateAttributeValueDto, @CurrentUser() user: AuthUser) {
    const attributeValue = await this.attributeValueService.create(body, user);
    return {
      success: true,
      data: attributeValue,
    };
  }

  @Get('listing/:listingId')
  async getByListingId(@Param('listingId', ParseIntPipe) listingId: number) {
    const attributeValues = await this.attributeValueService.getByListingId(listingId);
    return {
      success: true,
      data: attributeValues,
      count: attributeValues.length,
    };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const attributeValue = await this.attributeValueService.getById(id);
    return {
      success: true,
      data: attributeValue,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAttributeValueDto,
    @CurrentUser() user: AuthUser,
  ) {
    const attributeValue = await this.attributeValueService.update(id, body, user);
    return {
      success: true,
      data: attributeValue,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    await this.attributeValueService.delete(id, user);
    return {
      success: true,
      message: 'Wartość atrybutu została usunięta',
    };
  }
}
