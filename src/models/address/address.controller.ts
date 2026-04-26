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
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() body: CreateAddressDto, @Req() req: Request) {
    const userId = (req as any).user['id'];
    const address = await this.addressService.create(body, userId);
    return {
      success: true,
      data: address,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getUserAddresses(@Req() req: Request) {
    const userId = (req as any).user['id'];
    const addresses = await this.addressService.getUserAddresses(userId);
    return {
      success: true,
      data: addresses,
      count: addresses.length,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('count')
  async getAddressCount(@Req() req: Request) {
    const userId = (req as any).user['id'];
    const count = await this.addressService.getAddressCount(userId);
    return {
      success: true,
      data: {
        count,
      },
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const address = await this.addressService.getById(Number(id));
    return {
      success: true,
      data: address,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateAddressDto, @Req() req: Request) {
    const userId = (req as any).user['id'];
    const address = await this.addressService.update(Number(id), body, userId);
    return {
      success: true,
      data: address,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user['id'];
    await this.addressService.delete(Number(id), userId);
    return {
      success: true,
      message: 'Adres został usunięty',
    };
  }
}
