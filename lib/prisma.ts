import type { PrismaClient as PrismaClientType } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClientType };

function getClient(): PrismaClientType {
  if (!globalForPrisma.__prisma) {
    // Dynamic require avoids build-time initialization error
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client');
    globalForPrisma.__prisma = new PrismaClient();
  }
  return globalForPrisma.__prisma!;
}

export const prisma = new Proxy({} as PrismaClientType, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});
