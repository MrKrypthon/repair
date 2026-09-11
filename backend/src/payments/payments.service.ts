import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMethod, PaymentType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CreatePaymentInput = { amount: number; method: PaymentMethod; type: PaymentType; reference?: string };

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(folio: string) {
    const order = await this.prisma.serviceOrder.findUniqueOrThrow({ where: { folio }, include: { payments: { orderBy: { createdAt: 'desc' } } } });
    const totalPaid = order.payments.reduce((total, payment) => total.plus(payment.amount), new Prisma.Decimal(0));
    return { payments: order.payments, totalPaid, estimatedCost: order.estimatedCost, finalCost: order.finalCost };
  }

  async create(folio: string, data: CreatePaymentInput) {
    if (!data.amount || data.amount <= 0) throw new BadRequestException('El importe debe ser mayor que cero');
    const order = await this.prisma.serviceOrder.findUniqueOrThrow({ where: { folio } });
    return this.prisma.payment.create({ data: { serviceOrderId: order.id, amount: new Prisma.Decimal(data.amount), method: data.method, type: data.type, reference: data.reference } });
  }
}
