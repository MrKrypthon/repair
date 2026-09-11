import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.supplier.findMany({ include: { _count: { select: { items: true } } }, where: { active: true }, orderBy: { name: 'asc' } }); }

  create(data: { name: string; phone?: string; email?: string; notes?: string }) { return this.prisma.supplier.create({ data }); }
}
