import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AttachmentCategory, BudgetStatus, DeviceCategory, Prisma, ServiceOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

  type CreateOrderInput = {
  customerId: string;
  deviceId?: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  reportedIssue: string;
  priority?: Prisma.ServiceOrderCreateInput['priority'];
  serialNumber?: string;
  imei?: string;
  estimatedDeliveryAt?: string;
};

@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  findAll() {
    return this.prisma.serviceOrder.findMany({
      include: { customer: true, device: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
      orderBy: { receivedAt: 'desc' }
    });
  }

  async findOne(folio: string) {
    const order = await this.prisma.serviceOrder.findUniqueOrThrow({
      where: { folio },
      include: {
        customer: true,
        device: true,
        assignedTechnician: true,
        technicalNotes: { orderBy: { createdAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        parts: { include: { inventoryItem: true }, orderBy: { createdAt: 'desc' } },
        attachments: { orderBy: { createdAt: 'desc' } }
      }
    });
    return { ...order, attachments: order.attachments.map((attachment) => ({ ...attachment, url: this.storage.getUrl(attachment.key) })) };
  }

  async update(
    folio: string,
    data: {
      reportedIssue?: string;
      priority?: Prisma.ServiceOrderCreateInput['priority'];
      estimatedDeliveryAt?: string;
      device?: { category?: DeviceCategory; brand?: string; model?: string; serialNumber?: string; imei?: string; color?: string };
    }
  ) {
    const order = await this.prisma.serviceOrder.findUniqueOrThrow({ where: { folio } });
    return this.prisma.$transaction(async (transaction) => {
      if (data.device) {
        await transaction.device.update({ where: { id: order.deviceId }, data: data.device });
      }
      return transaction.serviceOrder.update({
        where: { folio },
        data: {
          reportedIssue: data.reportedIssue,
          priority: data.priority,
          estimatedDeliveryAt: data.estimatedDeliveryAt ? new Date(data.estimatedDeliveryAt) : undefined
        },
        include: { customer: true, device: true }
      });
    });
  }

  async updateStatus(folio: string, data: { status: ServiceOrderStatus; note?: string }) {
    const order = await this.prisma.serviceOrder.findUniqueOrThrow({ where: { folio } });

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.serviceOrder.update({ where: { folio }, data: { status: data.status } });
      await transaction.statusHistory.create({
        data: { serviceOrderId: order.id, previousStatus: order.status, newStatus: data.status, note: data.note }
      });
      return updated;
    });
  }

  updateBudget(folio: string, data: { partsCost: number; laborCost: number; otherCharges: number; budgetStatus: BudgetStatus; finalCost?: number }) {
    const partsCost = new Prisma.Decimal(data.partsCost || 0);
    const laborCost = new Prisma.Decimal(data.laborCost || 0);
    const otherCharges = new Prisma.Decimal(data.otherCharges || 0);
    return this.prisma.serviceOrder.update({
      where: { folio },
      data: { partsCost, laborCost, otherCharges, estimatedCost: partsCost.plus(laborCost).plus(otherCharges), finalCost: data.finalCost === undefined ? undefined : new Prisma.Decimal(data.finalCost), budgetStatus: data.budgetStatus }
    });
  }

  async addPart(folio: string, data: { inventoryItemId: string; quantity: number }) {
    if (!data.quantity || data.quantity <= 0) throw new BadRequestException('La cantidad debe ser mayor que cero');
    const order = await this.prisma.serviceOrder.findUniqueOrThrow({ where: { folio } });

    return this.prisma.$transaction(async (transaction) => {
      const item = await transaction.inventoryItem.findUniqueOrThrow({ where: { id: data.inventoryItemId } });
      if (item.stock < data.quantity) throw new BadRequestException('Stock insuficiente para esta pieza');
      const part = await transaction.orderPart.create({ data: { serviceOrderId: order.id, inventoryItemId: item.id, quantity: data.quantity, unitCost: item.cost, unitPrice: item.salePrice }, include: { inventoryItem: true } });
      await transaction.inventoryItem.update({ where: { id: item.id }, data: { stock: { decrement: data.quantity } } });
      await transaction.inventoryMovement.create({ data: { inventoryItemId: item.id, type: 'OUT', quantity: data.quantity, note: `Consumo en orden ${folio}` } });
      return part;
    });
  }

  updateDiagnosis(folio: string, data: { diagnosis?: string; probableCause?: string; testChecklist?: Record<string, boolean> }) {
    return this.prisma.serviceOrder.update({ where: { folio }, data });
  }

  assignTechnician(folio: string, technicianId?: string) {
    return this.prisma.serviceOrder.update({ where: { folio }, data: { assignedTechnicianId: technicianId || null }, include: { assignedTechnician: true } });
  }

  async deliver(folio: string, note?: string) {
    const order = await this.prisma.serviceOrder.findUniqueOrThrow({ where: { folio } });
    if (order.status !== ServiceOrderStatus.LISTO_ENTREGA) throw new BadRequestException('La orden debe estar lista para entrega');
    return this.prisma.$transaction(async (transaction) => {
      const delivered = await transaction.serviceOrder.update({ where: { folio }, data: { status: ServiceOrderStatus.ENTREGADO, deliveredAt: new Date() } });
      await transaction.statusHistory.create({ data: { serviceOrderId: order.id, previousStatus: order.status, newStatus: ServiceOrderStatus.ENTREGADO, note: note || 'Equipo entregado al cliente' } });
      await transaction.notification.create({ data: { title: 'Orden entregada', message: `La orden ${folio} fue marcada como entregada.`, type: 'SUCCESS' } });
      return delivered;
    });
  }

  async create(data: CreateOrderInput) {
    const folio = `OS-${Date.now().toString().slice(-6)}`;
    return this.prisma.$transaction(async (transaction) => {
      const device = data.deviceId
        ? await transaction.device.findFirstOrThrow({ where: { id: data.deviceId, customerId: data.customerId } })
        : await transaction.device.create({ data: { customerId: data.customerId, category: data.category, brand: data.brand, model: data.model, serialNumber: data.serialNumber, imei: data.imei } });

      return transaction.serviceOrder.create({
        data: {
          folio,
          publicTrackingToken: randomBytes(24).toString('hex'),
          customerId: data.customerId,
          deviceId: device.id,
          reportedIssue: data.reportedIssue,
          priority: data.priority,
          estimatedDeliveryAt: data.estimatedDeliveryAt ? new Date(data.estimatedDeliveryAt) : undefined,
          statusHistory: { create: { newStatus: ServiceOrderStatus.RECIBIDO, note: 'Orden creada' } }
        },
        include: { customer: true, device: true, statusHistory: true }
      });
    });
  }

  publicTracking(token: string) {
    return this.prisma.serviceOrder.findUniqueOrThrow({
      where: { publicTrackingToken: token },
      select: {
        folio: true,
        status: true,
        priority: true,
        receivedAt: true,
        estimatedDeliveryAt: true,
        estimatedCost: true,
        budgetStatus: true,
        device: { select: { category: true, brand: true, model: true } },
        statusHistory: { select: { newStatus: true, note: true, createdAt: true }, orderBy: { createdAt: 'asc' } }
      }
    });
  }

  publicBudget(token: string, budgetStatus: BudgetStatus) {
    if (budgetStatus === BudgetStatus.PENDING) throw new BadRequestException('El presupuesto debe ser autorizado o rechazado');
    return this.prisma.$transaction(async (transaction) => {
      const order = await transaction.serviceOrder.findUniqueOrThrow({ where: { publicTrackingToken: token } });
      const nextStatus = budgetStatus === BudgetStatus.APPROVED ? ServiceOrderStatus.EN_REPARACION : ServiceOrderStatus.SIN_REPARACION;
      const updated = await transaction.serviceOrder.update({ where: { id: order.id }, data: { budgetStatus, status: nextStatus }, select: { folio: true, budgetStatus: true, status: true } });
      await transaction.statusHistory.create({ data: { serviceOrderId: order.id, previousStatus: order.status, newStatus: nextStatus, note: budgetStatus === BudgetStatus.APPROVED ? 'Presupuesto autorizado por el cliente' : 'Presupuesto rechazado por el cliente' } });
      await transaction.notification.create({ data: { title: budgetStatus === BudgetStatus.APPROVED ? 'Presupuesto autorizado' : 'Presupuesto rechazado', message: `El cliente respondió el presupuesto de la orden ${order.folio}.`, type: budgetStatus === BudgetStatus.APPROVED ? 'SUCCESS' : 'WARNING' } });
      return updated;
    });
  }

  async addTechnicalNote(folio: string, data: { title: string; content: string; measurements?: string }) {
    const order = await this.prisma.serviceOrder.findUniqueOrThrow({ where: { folio } });
    return this.prisma.technicalNote.create({ data: { serviceOrderId: order.id, title: data.title, content: data.content, measurements: data.measurements } });
  }

  async addAttachment(folio: string, file: Express.Multer.File, category?: AttachmentCategory) {
    if (!file) throw new BadRequestException('Debes adjuntar un archivo');
    const order = await this.prisma.serviceOrder.findUniqueOrThrow({ where: { folio } });
    const key = await this.storage.upload(`service-orders/${folio}`, file.originalname, file.mimetype, file.buffer);
    const attachment = await this.prisma.orderAttachment.create({
      data: {
        serviceOrderId: order.id,
        fileName: file.originalname,
        key,
        mimeType: file.mimetype,
        size: file.size,
        category: category || (file.mimetype.startsWith('image/') ? AttachmentCategory.PHOTO : AttachmentCategory.DOCUMENT)
      }
    });
    return { ...attachment, url: this.storage.getUrl(attachment.key) };
  }

  async removeAttachment(folio: string, attachmentId: string) {
    const order = await this.prisma.serviceOrder.findUniqueOrThrow({ where: { folio } });
    const attachment = await this.prisma.orderAttachment.findFirst({ where: { id: attachmentId, serviceOrderId: order.id } });
    if (!attachment) throw new NotFoundException('El archivo no existe en esta orden');
    await this.storage.remove(attachment.key);
    await this.prisma.orderAttachment.delete({ where: { id: attachment.id } });
    return { id: attachment.id };
  }
}
