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
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: CreateAddressDto, @CurrentUser() user: AuthUser) {
    const userId = user.id;
    const address = await this.addressService.create(body, userId);
    return {
      success: true,
      data: address,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserAddresses(@CurrentUser() user: AuthUser) {
    const userId = user.id;
    const addresses = await this.addressService.getUserAddresses(userId);
    return {
      success: true,
      data: addresses,
      count: addresses.length,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('count')
  async getAddressCount(@CurrentUser() user: AuthUser) {
    const userId = user.id;
    const count = await this.addressService.getAddressCount(userId);
    return {
      success: true,
      data: {
        count,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    const address = await this.addressService.getById(id, user.id);
    return {
      success: true,
      data: address,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateAddressDto, @CurrentUser() user: AuthUser) {
    const userId = user.id;
    const address = await this.addressService.update(id, body, userId);
    return {
      success: true,
      data: address,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    const userId = user.id;
    await this.addressService.delete(id, userId);
    return {
      success: true,
      message: 'Adres został usunięty',
    };
  }
}
