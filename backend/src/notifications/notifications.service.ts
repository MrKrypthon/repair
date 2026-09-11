import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) { return this.prisma.notification.findMany({ where: { OR: [{ userId }, { userId: null }] }, orderBy: { createdAt: 'desc' }, take: 30 }); }

  markRead(id: string, userId: string) { return this.prisma.notification.updateMany({ where: { id, OR: [{ userId }, { userId: null }] }, data: { read: true } }); }
}
