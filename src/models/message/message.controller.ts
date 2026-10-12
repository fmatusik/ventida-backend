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
import { Throttle } from '@nestjs/throttler';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../../common/roles';
import { safeSkip, safeTake } from '../../common/pagination';

@UseGuards(JwtAuthGuard)
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post()
  async create(@Body() body: CreateMessageDto, @CurrentUser() user: AuthUser) {
    const message = await this.messageService.create(body, user.id);
    return { success: true, data: message };
  }

  @Get('chat/:chatId')
  async getMessagesByChatId(
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() user: AuthUser,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const messages = await this.messageService.getMessagesByChatId(
      chatId,
      user.id,
      safeSkip(skip),
      safeTake(take, 50),
    );
    return { success: true, data: messages, count: messages.length };
  }

  @Get('chat/:chatId/unread')
  async getUnreadCount(
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() user: AuthUser,
  ) {
    const count = await this.messageService.getUnreadMessagesCount(chatId, user.id);
    return { success: true, data: { unreadCount: count } };
  }

  @Post('chat/:chatId/read-all')
  async markChatAsRead(
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() user: AuthUser,
  ) {
    await this.messageService.markChatMessagesAsRead(chatId, user.id);
    return {
      success: true,
      message: 'Wszystkie wiadomości w czacie oznaczone jako przeczytane',
    };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    const message = await this.messageService.getById(id, user.id);
    return { success: true, data: message };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    const message = await this.messageService.update(id, body, user.id);
    return { success: true, data: message };
  }

  @Post(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    const message = await this.messageService.markAsRead(id, user.id);
    return {
      success: true,
      data: message,
      message: 'Wiadomość oznaczona jako przeczytana',
    };
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    await this.messageService.delete(id, user.id);
    return { success: true, message: 'Wiadomość została usunięta' };
  }
}
