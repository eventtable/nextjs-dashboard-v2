import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Default test account
  const hashedPassword1 = await bcrypt.hash('johndoe123', 12);
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      password: hashedPassword1,
    },
  });

  // Admin account
  const hashedPassword2 = await bcrypt.hash('Matrix2025!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@aktien-matrix.de' },
    update: {},
    create: {
      email: 'admin@aktien-matrix.de',
      name: 'Admin',
      password: hashedPassword2,
    },
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
