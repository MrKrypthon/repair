import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.customer.findMany({
      where: { active: true },
      include: { devices: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  findOne(id: string) {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id },
      include: { devices: true, orders: { include: { device: true }, orderBy: { receivedAt: 'desc' } } }
    });
  }

  create(data: { name: string; phone: string; email?: string; notes?: string }) {
    return this.prisma.customer.create({ data });
  }

  createDevice(customerId: string, data: { category: 'CELULAR' | 'TABLET' | 'LAPTOP' | 'CONSOLA' | 'TARJETA_ELECTRONICA' | 'OTRO'; brand: string; model: string; serialNumber?: string; imei?: string; color?: string; notes?: string }) {
    return this.prisma.device.create({ data: { ...data, customerId } });
  }

  update(id: string, data: { name?: string; phone?: string; email?: string; notes?: string; active?: boolean }) {
    return this.prisma.customer.update({ where: { id }, data });
  }
}
