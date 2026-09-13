import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.purchaseOrder.findMany({ include: { supplier: true, lines: { include: { inventoryItem: true } } }, orderBy: { createdAt: 'desc' } }); }

  create(data: { supplierId: string; notes?: string; lines: { inventoryItemId: string; quantity: number; unitCost: number }[] }) {
    const folio = `OC-${Date.now().toString().slice(-6)}`;
    return this.prisma.purchaseOrder.create({ data: { folio, supplierId: data.supplierId, notes: data.notes, lines: { create: data.lines.map((line) => ({ inventoryItemId: line.inventoryItemId, quantity: line.quantity, unitCost: new Prisma.Decimal(line.unitCost) })) } }, include: { supplier: true, lines: { include: { inventoryItem: true } } } });
  }

  async receive(id: string) {
    const order = await this.prisma.purchaseOrder.findUniqueOrThrow({ where: { id }, include: { lines: true } });
    if (order.status !== 'ORDERED') throw new BadRequestException('Solo se pueden recibir órdenes enviadas');
    return this.prisma.$transaction(async (transaction) => {
      for (const line of order.lines) {
        const item = await transaction.inventoryItem.findUniqueOrThrow({ where: { id: line.inventoryItemId } });
        await transaction.inventoryItem.update({ where: { id: line.inventoryItemId }, data: { stock: { increment: line.quantity }, cost: line.unitCost } });
        if (!item.cost.equals(line.unitCost)) {
          await transaction.inventoryPriceHistory.create({
            data: { inventoryItemId: line.inventoryItemId, previousCost: item.cost, newCost: line.unitCost, previousSalePrice: item.salePrice, newSalePrice: item.salePrice, source: 'PURCHASE_ORDER', reference: order.folio }
          });
        }
        await transaction.inventoryMovement.create({ data: { inventoryItemId: line.inventoryItemId, type: 'IN', quantity: line.quantity, note: `Recepción de ${order.folio}` } });
      }
      return transaction.purchaseOrder.update({ where: { id }, data: { status: 'RECEIVED' }, include: { supplier: true, lines: { include: { inventoryItem: true } } } });
    });
  }

  async order(id: string) {
    const current = await this.prisma.purchaseOrder.findUniqueOrThrow({ where: { id } });
    if (current.status !== 'DRAFT') throw new BadRequestException('Solo se pueden enviar órdenes en borrador');
    return this.prisma.purchaseOrder.update({ where: { id }, data: { status: 'ORDERED' }, include: { supplier: true, lines: true } });
  }

  async cancel(id: string) {
    const current = await this.prisma.purchaseOrder.findUniqueOrThrow({ where: { id } });
    if (current.status === 'RECEIVED') throw new BadRequestException('No se puede cancelar una orden recibida');
    return this.prisma.purchaseOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}
