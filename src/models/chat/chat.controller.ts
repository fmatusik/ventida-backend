import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() body: CreateChatDto, @Req() req: Request) {
    const userId = (req as any).user['id'];
    const chat = await this.chatService.create(body, userId);
    return {
      success: true,
      data: chat,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getMyChatts(@Req() req: Request) {
    const userId = (req as any).user['id'];
    const chats = await this.chatService.getChatsByUserId(userId);
    return {
      success: true,
      data: chats,
      count: chats.length,
    };
  }

  @Get('listing/:listingId')
  async getChatsByListingId(@Param('listingId') listingId: string) {
    const chats = await this.chatService.getChatsByListingId(Number(listingId));
    return {
      success: true,
      data: chats,
      count: chats.length,
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const chat = await this.chatService.getById(Number(id));
    return {
      success: true,
      data: chat,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user['id'];
    await this.chatService.delete(Number(id), userId);
    return {
      success: true,
      message: 'Chat został usunięty',
    };
  }
}
