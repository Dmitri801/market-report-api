import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { appConfig } from './config.js';
import { initDb } from './db.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerReportRoutes } from './routes/reports.js';

const server = Fastify({ logger: true });

async function start() {
  await initDb(appConfig.databaseUrl);

  await server.register(rateLimit, {
    max: appConfig.rateLimit.max,
    timeWindow: appConfig.rateLimit.timeWindow,
  });

  await registerHealthRoutes(server);
  await registerReportRoutes(server, appConfig);

  const address = await server.listen({ host: appConfig.host, port: appConfig.port });
  server.log.info(`Server listening at ${address}`);
}

start().catch((error) => {
  server.log.error(error);
  process.exit(1);
});
