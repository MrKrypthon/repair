const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@electronicatech.local' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@electronicatech.local',
      password: await bcrypt.hash('Admin123!', 12),
      role: 'ADMIN'
    }
  });
}

main().finally(() => prisma.$disconnect());
