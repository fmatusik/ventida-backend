import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() body: CreateMessageDto, @Req() req: Request) {
    const userId = (req as any).user['id'];
    const message = await this.messageService.create(body, userId);
    return {
      success: true,
      data: message,
    };
  }

  @Get('chat/:chatId')
  async getMessagesByChatId(
    @Param('chatId') chatId: string,
    @Query('skip') skip = 0,
    @Query('take') take = 50,
  ) {
    const messages = await this.messageService.getMessagesByChatId(Number(chatId), Number(skip), Number(take));
    return {
      success: true,
      data: messages,
      count: messages.length,
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const message = await this.messageService.getById(Number(id));
    return {
      success: true,
      data: message,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateMessageDto) {
    const message = await this.messageService.update(Number(id), body);
    return {
      success: true,
      data: message,
    };
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string) {
    const message = await this.messageService.markAsRead(Number(id));
    return {
      success: true,
      data: message,
      message: 'Wiadomość oznaczona jako przeczytana',
    };
  }

  @Post('chat/:chatId/read-all')
  async markChatAsRead(@Param('chatId') chatId: string) {
    await this.messageService.markChatMessagesAsRead(Number(chatId));
    return {
      success: true,
      message: 'Wszystkie wiadomości w czacie oznaczone jako przeczytane',
    };
  }

  @Get('chat/:chatId/unread')
  async getUnreadCount(@Param('chatId') chatId: string) {
    const count = await this.messageService.getUnreadMessagesCount(Number(chatId));
    return {
      success: true,
      data: {
        unreadCount: count,
      },
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.messageService.delete(Number(id));
    return {
      success: true,
      message: 'Wiadomość została usunięta',
    };
  }
}
