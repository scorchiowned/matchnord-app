import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Only create PrismaClient on server-side
export const db =
  typeof window === 'undefined'
    ? globalForPrisma.prisma ??
      new PrismaClient({
        log:
          env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
          db: {
            url: env.NODE_ENV === 'test' ? env.TEST_DATABASE_URL : env.DATABASE_URL,
          },
        },
      })
    : (null as unknown as PrismaClient);

if (typeof window === 'undefined' && env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
