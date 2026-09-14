import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly storage: StorageService
  ) {}

  private withAvatarUrl<T extends { avatarKey: string | null }>(user: T) {
    const { avatarKey, ...rest } = user;
    return { ...rest, avatarUrl: avatarKey ? this.storage.getUrl(avatarKey) : null };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.active || !(await bcrypt.compare(password, user.password))) throw new UnauthorizedException('Credenciales inválidas');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: this.withAvatarUrl({ id: user.id, name: user.name, email: user.email, role: user.role, avatarKey: user.avatarKey })
    };
  }

  async findUser(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ select: { id: true, name: true, email: true, role: true, active: true, avatarKey: true }, where: { id } });
    return this.withAvatarUrl(user);
  }

  listTechnicians() {
    return this.prisma.user.findMany({ where: { role: 'TECHNICIAN', active: true }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } });
  }

  async updateProfile(id: string, name: string) {
    const user = await this.prisma.user.update({ where: { id }, data: { name }, select: { id: true, name: true, email: true, role: true, active: true, avatarKey: true } });
    return this.withAvatarUrl(user);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    if (!(await bcrypt.compare(currentPassword, user.password))) throw new BadRequestException('La contraseña actual no es correcta');
    await this.prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(newPassword, 12) } });
    return { success: true };
  }

  async uploadAvatar(id: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Debes adjuntar una imagen');
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    const key = await this.storage.upload(`users/${id}`, file.originalname, file.mimetype, file.buffer);
    if (user.avatarKey) await this.storage.remove(user.avatarKey).catch(() => {});
    const updated = await this.prisma.user.update({ where: { id }, data: { avatarKey: key }, select: { id: true, name: true, email: true, role: true, active: true, avatarKey: true } });
    return this.withAvatarUrl(updated);
  }

  async removeAvatar(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    if (user.avatarKey) await this.storage.remove(user.avatarKey).catch(() => {});
    const updated = await this.prisma.user.update({ where: { id }, data: { avatarKey: null }, select: { id: true, name: true, email: true, role: true, active: true, avatarKey: true } });
    return this.withAvatarUrl(updated);
  }
}
