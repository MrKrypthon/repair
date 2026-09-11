import { Injectable } from '@nestjs/common';
import { Prisma, TechnicalDocumentCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CreateDocument = { title: string; category: TechnicalDocumentCategory; deviceBrand?: string; deviceModel?: string; description: string; keywords?: string; fileUrl?: string };

@Injectable()
export class TechnicalKnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query?: string) {
    const filter: Prisma.TechnicalDocumentWhereInput = query ? { OR: [{ title: { contains: query, mode: 'insensitive' } }, { deviceBrand: { contains: query, mode: 'insensitive' } }, { deviceModel: { contains: query, mode: 'insensitive' } }, { keywords: { contains: query, mode: 'insensitive' } }] } : {};
    return this.prisma.technicalDocument.findMany({ where: filter, include: { notes: true }, orderBy: { updatedAt: 'desc' } });
  }

  create(data: CreateDocument) { return this.prisma.technicalDocument.create({ data }); }
}
