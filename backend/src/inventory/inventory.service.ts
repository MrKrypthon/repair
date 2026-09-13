import { BadRequestException, Injectable } from '@nestjs/common';
import { InventoryMovementType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

type CreateItem = { name: string; sku: string; category: string; cost: number; salePrice: number; stock?: number; minimumStock?: number; supplierId?: string };
type StockChange = { type: InventoryMovementType; quantity: number; note?: string };
type UpdateItem = { name?: string; category?: string; cost?: number; salePrice?: number; minimumStock?: number; supplierId?: string };

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  private withImageUrl<T extends { imageKey: string | null }>(item: T) {
    return { ...item, imageUrl: item.imageKey ? this.storage.getUrl(item.imageKey) : null };
  }

  async findAll(query?: string) {
    const filter: Prisma.InventoryItemWhereInput = query ? { OR: [{ name: { contains: query, mode: 'insensitive' } }, { sku: { contains: query, mode: 'insensitive' } }, { category: { contains: query, mode: 'insensitive' } }] } : {};
    const items = await this.prisma.inventoryItem.findMany({ where: filter, include: { supplier: true, movements: { orderBy: { createdAt: 'desc' }, take: 5 } }, orderBy: { name: 'asc' } });
    return items.map((item) => this.withImageUrl(item));
  }

  async create(data: CreateItem) {
    const item = await this.prisma.inventoryItem.create({ data: { ...data, cost: new Prisma.Decimal(data.cost), salePrice: new Prisma.Decimal(data.salePrice) } });
    return this.withImageUrl(item);
  }

  async adjustStock(id: string, data: StockChange) {
    if (!data.quantity || data.quantity <= 0) throw new BadRequestException('La cantidad debe ser mayor que cero');
    const item = await this.prisma.inventoryItem.findUniqueOrThrow({ where: { id } });
    const nextStock = data.type === 'OUT' ? item.stock - data.quantity : item.stock + data.quantity;
    if (nextStock < 0) throw new BadRequestException('Stock insuficiente');
    return this.prisma.$transaction(async (transaction) => {
      await transaction.inventoryMovement.create({ data: { inventoryItemId: id, type: data.type, quantity: data.quantity, note: data.note } });
      const updated = await transaction.inventoryItem.update({ where: { id }, data: { stock: nextStock } });
      if (item.stock > item.minimumStock && nextStock <= item.minimumStock) {
        await transaction.notification.create({
          data: { title: 'Stock bajo', message: `"${item.name}" (SKU ${item.sku}) llegó a ${nextStock} unidades, por debajo del mínimo (${item.minimumStock}).`, type: 'WARNING' }
        });
      }
      return updated;
    });
  }

  async update(id: string, data: UpdateItem) {
    const item = await this.prisma.inventoryItem.findUniqueOrThrow({ where: { id } });
    const nextCost = data.cost !== undefined ? new Prisma.Decimal(data.cost) : item.cost;
    const nextSalePrice = data.salePrice !== undefined ? new Prisma.Decimal(data.salePrice) : item.salePrice;
    const priceChanged = !nextCost.equals(item.cost) || !nextSalePrice.equals(item.salePrice);

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.inventoryItem.update({
        where: { id },
        data: { name: data.name, category: data.category, cost: nextCost, salePrice: nextSalePrice, minimumStock: data.minimumStock, supplierId: data.supplierId }
      });
      if (priceChanged) {
        await transaction.inventoryPriceHistory.create({
          data: { inventoryItemId: id, previousCost: item.cost, newCost: nextCost, previousSalePrice: item.salePrice, newSalePrice: nextSalePrice, source: 'MANUAL' }
        });
      }
      return this.withImageUrl(updated);
    });
  }

  priceHistory(id: string) {
    return this.prisma.inventoryPriceHistory.findMany({ where: { inventoryItemId: id }, orderBy: { createdAt: 'desc' } });
  }

  async uploadImage(id: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Debes adjuntar una imagen');
    const item = await this.prisma.inventoryItem.findUniqueOrThrow({ where: { id } });
    const key = await this.storage.upload(`inventory/${id}`, file.originalname, file.mimetype, file.buffer);
    if (item.imageKey) await this.storage.remove(item.imageKey).catch(() => {});
    const updated = await this.prisma.inventoryItem.update({ where: { id }, data: { imageKey: key } });
    return this.withImageUrl(updated);
  }

  async removeImage(id: string) {
    const item = await this.prisma.inventoryItem.findUniqueOrThrow({ where: { id } });
    if (item.imageKey) await this.storage.remove(item.imageKey).catch(() => {});
    const updated = await this.prisma.inventoryItem.update({ where: { id }, data: { imageKey: null } });
    return this.withImageUrl(updated);
  }
}
