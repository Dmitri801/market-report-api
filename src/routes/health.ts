import type { FastifyInstance } from 'fastify';

export async function registerHealthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    return { ok: true, uptime: process.uptime() };
  });
}
