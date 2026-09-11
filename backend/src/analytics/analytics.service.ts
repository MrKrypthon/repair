import { Injectable } from '@nestjs/common';
import { ServiceOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const now = new Date();
    const [inRepair, ready, pendingAuthorization, overdue, stockItems, payments, customers, receivedToday, financialOrders, parts] = await Promise.all([
      this.prisma.serviceOrder.count({ where: { status: { in: [ServiceOrderStatus.EN_REPARACION, ServiceOrderStatus.EN_PRUEBAS, ServiceOrderStatus.EN_DIAGNOSTICO] } } }),
      this.prisma.serviceOrder.count({ where: { status: ServiceOrderStatus.LISTO_ENTREGA } }),
      this.prisma.serviceOrder.count({ where: { status: ServiceOrderStatus.ESPERA_AUTORIZACION } }),
      this.prisma.serviceOrder.count({ where: { estimatedDeliveryAt: { lt: now }, status: { notIn: [ServiceOrderStatus.ENTREGADO, ServiceOrderStatus.CANCELADO] } } }),
      this.prisma.inventoryItem.findMany({ select: { stock: true, minimumStock: true } }),
      this.prisma.payment.aggregate({ _sum: { amount: true } }),
      this.prisma.customer.count(),
      this.prisma.serviceOrder.count({ where: { receivedAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } } })
      ,this.prisma.serviceOrder.findMany({ select: { estimatedCost: true, finalCost: true } })
      ,this.prisma.orderPart.findMany({ select: { quantity: true, unitCost: true } })
    ]);

    const lowStock = stockItems.filter((item) => item.stock <= item.minimumStock).length;
    const revenue = financialOrders.reduce((total, order) => total + Number(order.finalCost || order.estimatedCost || 0), 0);
    const partsCost = parts.reduce((total, part) => total + Number(part.unitCost) * part.quantity, 0);
    const estimatedProfit = revenue - partsCost;
    return { inRepair, ready, pendingAuthorization, overdue, lowStock, totalCollected: payments._sum.amount || 0, customers, receivedToday, estimatedProfit, margin: revenue ? (estimatedProfit / revenue) * 100 : 0 };
  }
}
