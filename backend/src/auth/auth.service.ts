import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.active || !(await bcrypt.compare(password, user.password))) throw new UnauthorizedException('Credenciales inválidas');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return { accessToken: await this.jwt.signAsync(payload), user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  findUser(id: string) {
    return this.prisma.user.findUniqueOrThrow({ select: { id: true, name: true, email: true, role: true, active: true }, where: { id } });
  }

  listTechnicians() {
    return this.prisma.user.findMany({ where: { role: 'TECHNICIAN', active: true }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } });
  }
}
