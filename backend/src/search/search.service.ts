import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const RESULT_LIMIT = 5;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string) {
    const query = q?.trim();
    if (!query || query.length < 2) return { customers: [], serviceOrders: [], inventory: [] };

    const [customers, serviceOrders, inventory] = await Promise.all([
      this.prisma.customer.findMany({
        where: {
          active: true,
          OR: [{ name: { contains: query, mode: 'insensitive' } }, { phone: { contains: query, mode: 'insensitive' } }, { email: { contains: query, mode: 'insensitive' } }]
        },
        select: { id: true, name: true, phone: true },
        take: RESULT_LIMIT
      }),
      this.prisma.serviceOrder.findMany({
        where: {
          OR: [
            { folio: { contains: query, mode: 'insensitive' } },
            { reportedIssue: { contains: query, mode: 'insensitive' } },
            { customer: { name: { contains: query, mode: 'insensitive' } } },
            { device: { brand: { contains: query, mode: 'insensitive' } } },
            { device: { model: { contains: query, mode: 'insensitive' } } }
          ]
        },
        select: { folio: true, status: true, customer: { select: { name: true } }, device: { select: { brand: true, model: true } } },
        orderBy: { receivedAt: 'desc' },
        take: RESULT_LIMIT
      }),
      this.prisma.inventoryItem.findMany({
        where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { sku: { contains: query, mode: 'insensitive' } }] },
        select: { id: true, name: true, sku: true, stock: true },
        take: RESULT_LIMIT
      })
    ]);

    return { customers, serviceOrders, inventory };
  }
}
