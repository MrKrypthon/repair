import { ConflictException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, active: true, createdAt: true }, orderBy: { name: 'asc' } }); }

  async create(data: { name: string; email: string; password: string; role: UserRole }) {
    const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ConflictException('El correo ya está registrado');
    return this.prisma.user.create({ data: { name: data.name, email: data.email, password: await bcrypt.hash(data.password, 12), role: data.role }, select: { id: true, name: true, email: true, role: true, active: true } });
  }
}
