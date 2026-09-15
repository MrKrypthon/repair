import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DeviceCategory, Prisma, QuotationStatus } from '@prisma/client';
import { generateFolio } from '../common/folio';
import { PrismaService } from '../prisma/prisma.service';

type QuotationItemInput = { description: string; quantity: number; unitPrice: number };

type CreateQuotationInput = {
  customerId: string;
  deviceId?: string;
  category?: DeviceCategory;
  brand?: string;
  model?: string;
  issueDescription: string;
  notes?: string;
  validUntil?: string;
  items: QuotationItemInput[];
};

type UpdateQuotationInput = {
  issueDescription?: string;
  notes?: string;
  validUntil?: string;
  items?: QuotationItemInput[];
};

const detailInclude = {
  customer: true,
  device: true,
  createdBy: { select: { id: true, name: true } },
  items: true,
  serviceOrder: { select: { folio: true } }
};

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(status?: QuotationStatus) {
    return this.prisma.quotation.findMany({
      where: status ? { status } : undefined,
      include: { customer: true, device: true, items: true, serviceOrder: { select: { folio: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  findOne(folio: string) {
    return this.prisma.quotation.findUniqueOrThrow({ where: { folio }, include: detailInclude });
  }

  async create(data: CreateQuotationInput, createdById?: string) {
    if (!data.deviceId && (!data.category || !data.brand || !data.model)) {
      throw new BadRequestException('Indica un equipo existente o los datos de marca, modelo y categoría');
    }
    const folio = generateFolio('COT');
    return this.prisma.$transaction(async (transaction) => {
      const device = data.deviceId
        ? await transaction.device.findFirstOrThrow({ where: { id: data.deviceId, customerId: data.customerId } })
        : await transaction.device.create({ data: { customerId: data.customerId, category: data.category!, brand: data.brand!, model: data.model! } });

      return transaction.quotation.create({
        data: {
          folio,
          customerId: data.customerId,
          deviceId: device.id,
          issueDescription: data.issueDescription,
          notes: data.notes,
          validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
          createdById,
          items: { create: data.items.map((item) => ({ description: item.description, quantity: item.quantity, unitPrice: new Prisma.Decimal(item.unitPrice) })) }
        },
        include: detailInclude
      });
    });
  }

  async update(folio: string, data: UpdateQuotationInput) {
    const quotation = await this.prisma.quotation.findUniqueOrThrow({ where: { folio } });
    if (quotation.status !== 'DRAFT') throw new BadRequestException('Solo se puede editar una cotización en borrador');
    return this.prisma.$transaction(async (transaction) => {
      if (data.items) await transaction.quotationItem.deleteMany({ where: { quotationId: quotation.id } });
      return transaction.quotation.update({
        where: { folio },
        data: {
          issueDescription: data.issueDescription,
          notes: data.notes,
          validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
          items: data.items ? { create: data.items.map((item) => ({ description: item.description, quantity: item.quantity, unitPrice: new Prisma.Decimal(item.unitPrice) })) } : undefined
        },
        include: detailInclude
      });
    });
  }

  async updateStatus(folio: string, status: 'SENT' | 'APPROVED' | 'REJECTED') {
    const quotation = await this.prisma.quotation.findUniqueOrThrow({ where: { folio } });
    if (quotation.status === 'CONVERTED' || quotation.status === 'APPROVED' || quotation.status === 'REJECTED') {
      throw new BadRequestException('La cotización ya no admite cambios de estado');
    }
    return this.prisma.quotation.update({ where: { folio }, data: { status }, include: detailInclude });
  }

  async convert(folio: string) {
    const quotation = await this.prisma.quotation.findUniqueOrThrow({ where: { folio }, include: { items: true } });
    if (quotation.status !== 'APPROVED') throw new BadRequestException('Solo se pueden convertir cotizaciones aprobadas');
    if (quotation.serviceOrderId) throw new BadRequestException('Esta cotización ya fue convertida en una orden');

    const total = quotation.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    const orderFolio = generateFolio('OS');

    return this.prisma.$transaction(async (transaction) => {
      const order = await transaction.serviceOrder.create({
        data: {
          folio: orderFolio,
          publicTrackingToken: randomBytes(24).toString('hex'),
          customerId: quotation.customerId,
          deviceId: quotation.deviceId,
          reportedIssue: quotation.issueDescription,
          estimatedCost: new Prisma.Decimal(total),
          otherCharges: new Prisma.Decimal(total),
          statusHistory: { create: { newStatus: 'RECIBIDO', note: `Orden generada desde la cotización ${quotation.folio}` } }
        }
      });
      await transaction.quotation.update({ where: { id: quotation.id }, data: { status: 'CONVERTED', serviceOrderId: order.id } });
      return transaction.serviceOrder.findUniqueOrThrow({ where: { id: order.id }, include: { customer: true, device: true } });
    });
  }
}
