import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { marketReportSchema, type MarketReport } from '../schema.js';
import { saveReport, getLatestReport, getHistory } from '../db.js';
import type { AppConfig } from '../config.js';

interface ImportRequestBody {
  sourceUrl?: string;
}

interface HistoryQuery {
  limit?: string;
}

function requireApiKey(config: AppConfig) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!config.apiKey) return;
    const incomingKey =
      (request.headers['x-api-key'] as string | undefined) ??
      (request.query as any).apiKey;

    if (!incomingKey || incomingKey !== config.apiKey) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  };
}

async function fetchReportFromSource(sourceUrl: string): Promise<MarketReport> {
  const response = await fetch(sourceUrl, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Failed to fetch report from source: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return marketReportSchema.parse(payload);
}

export async function registerReportRoutes(fastify: FastifyInstance, config: AppConfig) {
  fastify.addHook('preHandler', requireApiKey(config));

  fastify.post('/reports', async (request, reply) => {
    const report = marketReportSchema.parse(request.body);
    const stored = await saveReport(report);
    return reply.status(201).send({ ok: true, report: stored });
  });

  fastify.post('/reports/import', async (request, reply) => {
    const body = request.body as ImportRequestBody;
    const sourceUrl = body?.sourceUrl ?? config.externalReportUrl;
    if (!sourceUrl) {
      return reply.status(400).send({ error: 'Missing sourceUrl and no EXTERNAL_REPORT_URL configured' });
    }

    const report = await fetchReportFromSource(sourceUrl);
    const stored = await saveReport(report);
    return reply.status(201).send({ ok: true, report: stored });
  });

  fastify.get('/reports/latest', async () => {
    const report = await getLatestReport();
    return { ok: true, report };
  });

  fastify.get('/reports', async (request) => {
    const query = request.query as HistoryQuery;
    const limit = query.limit ? Number(query.limit) : 10;
    const history = await getHistory(limit);
    return { ok: true, history };
  });
}
