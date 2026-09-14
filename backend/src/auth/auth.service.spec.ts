import * as bcrypt from 'bcryptjs';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = { user: { findUnique: jest.fn() } };
  const jwt = { signAsync: jest.fn() };
  const storage = { getUrl: jest.fn() };
  const service = new AuthService(prisma as never, jwt as never, storage as never);

  beforeEach(() => {
    jest.clearAllMocks();
    jwt.signAsync.mockResolvedValue('signed-token');
  });

  it('returns a JWT and safe user data for valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Admin', email: 'admin@test.local', password: 'hashed', role: 'ADMIN', active: true });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    await expect(service.login('admin@test.local', 'Admin123!')).resolves.toEqual({
      accessToken: 'signed-token',
      user: { id: 'user-1', name: 'Admin', email: 'admin@test.local', role: 'ADMIN', avatarUrl: null }
    });
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'user-1', email: 'admin@test.local', role: 'ADMIN' });
  });

  it('rejects invalid or inactive credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', password: 'hashed', active: false });

    await expect(service.login('admin@test.local', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
});
