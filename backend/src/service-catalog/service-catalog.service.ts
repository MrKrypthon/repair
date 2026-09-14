import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CreateItem = { name: string; description?: string; cost?: number; price: number };
type UpdateItem = { name?: string; description?: string; cost?: number; price?: number };

@Injectable()
export class ServiceCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query?: string, includeInactive?: boolean) {
    return this.prisma.serviceCatalogItem.findMany({
      where: {
        ...(includeInactive ? {} : { active: true }),
        ...(query ? { name: { contains: query, mode: 'insensitive' } } : {})
      },
      orderBy: { name: 'asc' }
    });
  }

  create(data: CreateItem) {
    return this.prisma.serviceCatalogItem.create({ data: { name: data.name, description: data.description, cost: data.cost ?? 0, price: data.price } });
  }

  update(id: string, data: UpdateItem) {
    return this.prisma.serviceCatalogItem.update({ where: { id }, data });
  }

  archive(id: string, active: boolean) {
    return this.prisma.serviceCatalogItem.update({ where: { id }, data: { active } });
  }
}
