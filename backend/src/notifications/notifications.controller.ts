import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Req() request: { user: { sub: string } }) { return this.notificationsService.findAll(request.user.sub); }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() request: { user: { sub: string } }) { return this.notificationsService.markRead(id, request.user.sub); }
}
