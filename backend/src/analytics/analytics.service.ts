import { Injectable } from '@nestjs/common';
import { ServiceOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const now = new Date();
    const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayStart = dayStart(now);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    const [
      inRepair,
      ready,
      pendingAuthorization,
      overdue,
      stockItems,
      payments,
      customers,
      receivedToday,
      financialOrders,
      parts,
      statusCounts,
      receivedInWeek,
      deliveredInWeek,
      todayOrders
    ] = await Promise.all([
      this.prisma.serviceOrder.count({ where: { status: { in: [ServiceOrderStatus.EN_REPARACION, ServiceOrderStatus.EN_PRUEBAS, ServiceOrderStatus.EN_DIAGNOSTICO] } } }),
      this.prisma.serviceOrder.count({ where: { status: ServiceOrderStatus.LISTO_ENTREGA } }),
      this.prisma.serviceOrder.count({ where: { status: ServiceOrderStatus.ESPERA_AUTORIZACION } }),
      this.prisma.serviceOrder.count({ where: { estimatedDeliveryAt: { lt: now }, status: { notIn: [ServiceOrderStatus.ENTREGADO, ServiceOrderStatus.CANCELADO] } } }),
      this.prisma.inventoryItem.findMany({ select: { stock: true, minimumStock: true } }),
      this.prisma.payment.aggregate({ _sum: { amount: true } }),
      this.prisma.customer.count(),
      this.prisma.serviceOrder.count({ where: { receivedAt: { gte: todayStart } } }),
      this.prisma.serviceOrder.findMany({ select: { estimatedCost: true, finalCost: true } }),
      this.prisma.orderPart.findMany({ select: { quantity: true, unitCost: true } }),
      this.prisma.serviceOrder.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.serviceOrder.findMany({ where: { receivedAt: { gte: weekStart } }, select: { receivedAt: true } }),
      this.prisma.serviceOrder.findMany({ where: { deliveredAt: { gte: weekStart } }, select: { deliveredAt: true } }),
      this.prisma.serviceOrder.findMany({ where: { receivedAt: { gte: todayStart } }, select: { device: { select: { category: true } } } })
    ]);

    const lowStock = stockItems.filter((item) => item.stock <= item.minimumStock).length;
    const revenue = financialOrders.reduce((total, order) => total + Number(order.finalCost || order.estimatedCost || 0), 0);
    const partsCost = parts.reduce((total, part) => total + Number(part.unitCost) * part.quantity, 0);
    const estimatedProfit = revenue - partsCost;

    const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const weeklyVolume = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      const received = receivedInWeek.filter((order) => dayStart(order.receivedAt).getTime() === date.getTime()).length;
      const delivered = deliveredInWeek.filter((order) => order.deliveredAt && dayStart(order.deliveredAt).getTime() === date.getTime()).length;
      return { label: dayLabels[date.getDay()], received, delivered };
    });

    const statusMap = Object.fromEntries(statusCounts.map((row) => [row.status, row._count._all]));
    const statusBreakdown = {
      inDiagnosis: (statusMap[ServiceOrderStatus.ESPERA_DIAGNOSTICO] || 0) + (statusMap[ServiceOrderStatus.EN_DIAGNOSTICO] || 0),
      inRepair: (statusMap[ServiceOrderStatus.EN_REPARACION] || 0) + (statusMap[ServiceOrderStatus.EN_PRUEBAS] || 0),
      pendingAuthorization: statusMap[ServiceOrderStatus.ESPERA_AUTORIZACION] || 0,
      ready: statusMap[ServiceOrderStatus.LISTO_ENTREGA] || 0
    };

    const todayByCategory = todayOrders.reduce((acc: Record<string, number>, order) => {
      acc[order.device.category] = (acc[order.device.category] || 0) + 1;
      return acc;
    }, {});

    return {
      inRepair,
      ready,
      pendingAuthorization,
      overdue,
      lowStock,
      totalCollected: payments._sum.amount || 0,
      customers,
      receivedToday,
      estimatedProfit,
      margin: revenue ? (estimatedProfit / revenue) * 100 : 0,
      weeklyVolume,
      statusBreakdown,
      todayReception: { total: todayOrders.length, byCategory: todayByCategory }
    };
  }

  async technicianReport(from?: string, to?: string) {
    const start = from ? new Date(from) : undefined;
    const end = to ? new Date(to) : undefined;
    const deliveredFilter = start || end ? { gte: start, lte: end } : undefined;

    const technicians = await this.prisma.user.findMany({ where: { role: 'TECHNICIAN' }, select: { id: true, name: true }, orderBy: { name: 'asc' } });

    const rows = await Promise.all(
      technicians.map(async (technician) => {
        const [closedOrders, activeOrders] = await Promise.all([
          this.prisma.serviceOrder.findMany({
            where: { assignedTechnicianId: technician.id, status: ServiceOrderStatus.ENTREGADO, ...(deliveredFilter ? { deliveredAt: deliveredFilter } : {}) },
            select: { receivedAt: true, deliveredAt: true, finalCost: true, estimatedCost: true, parts: { select: { unitCost: true, quantity: true } } }
          }),
          this.prisma.serviceOrder.count({
            where: { assignedTechnicianId: technician.id, status: { notIn: [ServiceOrderStatus.ENTREGADO, ServiceOrderStatus.CANCELADO, ServiceOrderStatus.SIN_REPARACION] } }
          })
        ]);

        const closedCount = closedOrders.length;
        const totalDays = closedOrders.reduce((sum, order) => sum + (order.deliveredAt ? (order.deliveredAt.getTime() - order.receivedAt.getTime()) / 86400000 : 0), 0);
        const revenue = closedOrders.reduce((sum, order) => sum + Number(order.finalCost || order.estimatedCost || 0), 0);
        const partsCost = closedOrders.reduce((sum, order) => sum + order.parts.reduce((partSum, part) => partSum + Number(part.unitCost) * part.quantity, 0), 0);

        return {
          id: technician.id,
          name: technician.name,
          closedOrders: closedCount,
          activeOrders,
          avgRepairDays: closedCount ? totalDays / closedCount : 0,
          revenue,
          profit: revenue - partsCost
        };
      })
    );

    return rows.sort((a, b) => b.closedOrders - a.closedOrders);
  }
}
