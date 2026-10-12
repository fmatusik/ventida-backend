import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../../common/roles';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async create(@Body() body: CreateChatDto, @CurrentUser() user: AuthUser) {
    const chat = await this.chatService.create(body, user.id);
    return { success: true, data: chat };
  }

  @Get()
  async getMyChats(@CurrentUser() user: AuthUser) {
    const chats = await this.chatService.getChatsByUserId(user.id);
    return { success: true, data: chats, count: chats.length };
  }

  @Get('listing/:listingId')
  async getChatsByListingId(
    @Param('listingId', ParseIntPipe) listingId: number,
    @CurrentUser() user: AuthUser,
  ) {
    const chats = await this.chatService.getChatsByListingId(listingId, user);
    return { success: true, data: chats, count: chats.length };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    const chat = await this.chatService.getById(id, user);
    return { success: true, data: chat };
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    await this.chatService.delete(id, user);
    return { success: true, message: 'Chat został usunięty' };
  }
}
