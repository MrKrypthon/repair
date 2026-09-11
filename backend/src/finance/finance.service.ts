import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const paymentTypeLabels: Record<string, string> = { DEPOSIT: 'Anticipo', PARTIAL: 'Pago parcial', FINAL: 'Pago final' };

type MonthBucket = { key: string; label: string; income: number; expenses: number };

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

function buildMonthlySeries(payments: { amount: unknown; createdAt: Date }[], purchaseOrders: { updatedAt: Date; total: number }[], since: Date) {
  const months: MonthBucket[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < 12; i++) {
    months.push({ key: monthKey(cursor), label: cursor.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }), income: 0, expenses: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const byKey = new Map(months.map((month) => [month.key, month]));
  for (const payment of payments) {
    const bucket = byKey.get(monthKey(new Date(payment.createdAt)));
    if (bucket) bucket.income += Number(payment.amount);
  }
  for (const order of purchaseOrders) {
    const bucket = byKey.get(monthKey(new Date(order.updatedAt)));
    if (bucket) bucket.expenses += order.total;
  }
  return months;
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(from?: string, to?: string) {
    const start = from ? new Date(from) : undefined;
    const end = to ? new Date(to) : undefined;

    const [payments, purchaseOrders] = await Promise.all([
      this.prisma.payment.findMany({
        where: start || end ? { createdAt: { gte: start, lte: end } } : undefined,
        select: { id: true, amount: true, method: true, type: true, createdAt: true, serviceOrder: { select: { folio: true, customer: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.purchaseOrder.findMany({
        where: { status: 'RECEIVED', ...(start || end ? { updatedAt: { gte: start, lte: end } } : {}) },
        select: { id: true, folio: true, updatedAt: true, supplier: { select: { name: true } }, lines: { select: { unitCost: true, quantity: true } } },
        orderBy: { updatedAt: 'desc' }
      })
    ]);

    const purchaseOrderTotals = purchaseOrders.map((order) => ({
      ...order,
      total: order.lines.reduce((sum, line) => sum + Number(line.unitCost) * line.quantity, 0)
    }));

    const income = payments.reduce((total, payment) => total + Number(payment.amount), 0);
    const expenses = purchaseOrderTotals.reduce((total, order) => total + order.total, 0);
    const netProfit = income - expenses;

    const movements = [
      ...payments.map((payment) => ({
        id: payment.id,
        type: 'INCOME' as const,
        date: payment.createdAt,
        amount: Number(payment.amount),
        description: `Pago ${paymentTypeLabels[payment.type] || payment.type} · ${payment.serviceOrder.folio} · ${payment.serviceOrder.customer.name}`,
        detail: payment.method
      })),
      ...purchaseOrderTotals.map((order) => ({
        id: order.id,
        type: 'EXPENSE' as const,
        date: order.updatedAt,
        amount: order.total,
        description: `Compra a ${order.supplier.name} · ${order.folio}`,
        detail: null
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const trendSince = new Date();
    trendSince.setMonth(trendSince.getMonth() - 11);
    trendSince.setDate(1);
    trendSince.setHours(0, 0, 0, 0);

    const [trendPayments, trendPurchaseOrders] = await Promise.all([
      this.prisma.payment.findMany({ where: { createdAt: { gte: trendSince } }, select: { amount: true, createdAt: true } }),
      this.prisma.purchaseOrder.findMany({ where: { status: 'RECEIVED', updatedAt: { gte: trendSince } }, select: { updatedAt: true, lines: { select: { unitCost: true, quantity: true } } } })
    ]);
    const trendPurchaseOrderTotals = trendPurchaseOrders.map((order) => ({ updatedAt: order.updatedAt, total: order.lines.reduce((sum, line) => sum + Number(line.unitCost) * line.quantity, 0) }));

    return {
      income,
      expenses,
      netProfit,
      isProfit: netProfit >= 0,
      margin: income ? (netProfit / income) * 100 : 0,
      monthly: buildMonthlySeries(trendPayments, trendPurchaseOrderTotals, trendSince),
      movements
    };
  }
}
