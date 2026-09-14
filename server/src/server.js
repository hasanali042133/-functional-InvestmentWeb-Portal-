import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const start = async () => {
  try {
    await prisma.$connect();
    console.info('[db] connected');
  } catch (error) {
    console.error('[db] connection failed:', error.message);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.info(`[api] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal) => {
    console.info(`\n[api] ${signal} received, shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start();
