import { BadRequestException, Injectable } from '@nestjs/common';
import { InventoryMovementType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CreateItem = { name: string; sku: string; category: string; cost: number; salePrice: number; stock?: number; minimumStock?: number; supplierId?: string };
type StockChange = { type: InventoryMovementType; quantity: number; note?: string };

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.inventoryItem.findMany({ include: { supplier: true, movements: { orderBy: { createdAt: 'desc' }, take: 5 } }, orderBy: { name: 'asc' } }); }

  create(data: CreateItem) {
    return this.prisma.inventoryItem.create({ data: { ...data, cost: new Prisma.Decimal(data.cost), salePrice: new Prisma.Decimal(data.salePrice) } });
  }

  async adjustStock(id: string, data: StockChange) {
    if (!data.quantity || data.quantity <= 0) throw new BadRequestException('La cantidad debe ser mayor que cero');
    const item = await this.prisma.inventoryItem.findUniqueOrThrow({ where: { id } });
    const nextStock = data.type === 'OUT' ? item.stock - data.quantity : item.stock + data.quantity;
    if (nextStock < 0) throw new BadRequestException('Stock insuficiente');
    return this.prisma.$transaction(async (transaction) => {
      await transaction.inventoryMovement.create({ data: { inventoryItemId: id, type: data.type, quantity: data.quantity, note: data.note } });
      return transaction.inventoryItem.update({ where: { id }, data: { stock: nextStock } });
    });
  }
}
