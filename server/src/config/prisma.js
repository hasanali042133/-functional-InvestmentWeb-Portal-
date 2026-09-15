import { PrismaClient } from '@prisma/client';
import { isProduction } from './env.js';

const createClient = () =>
  new PrismaClient({ log: isProduction ? ['error'] : ['warn', 'error'] });

// Cached on globalThis in development so nodemon restarts do not exhaust the
// database connection pool.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__prisma ?? createClient();

if (!isProduction) {
  globalForPrisma.__prisma = prisma;
}
