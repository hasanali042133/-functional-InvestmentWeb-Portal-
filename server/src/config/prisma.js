import { PrismaClient } from '@prisma/client';
import { isProduction } from './env.js';

/**
 * A single Prisma client is reused across the process. In development the
 * instance is cached on `globalThis` so nodemon restarts do not exhaust the
 * database connection pool.
 */
const createPrismaClient = () =>
  new PrismaClient({
    log: isProduction ? ['error'] : ['warn', 'error'],
  });

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__prisma ?? createPrismaClient();

if (!isProduction) {
  globalForPrisma.__prisma = prisma;
}
