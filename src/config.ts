import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL ?? '';
const externalReportUrl = process.env.EXTERNAL_REPORT_URL ?? process.env.REPORT_SOURCE_URL ?? '';

export const appConfig = {
  port: Number(process.env.PORT) || 4000,
  host: process.env.HOST ?? '127.0.0.1',
  apiKey: process.env.API_KEY ?? '',
  databaseUrl,
  externalReportUrl,
  rateLimit: {
    max: Number(process.env.RATE_LIMIT_MAX) || 60,
    timeWindow: process.env.RATE_LIMIT_WINDOW ?? '1 minute',
  },
};

export type AppConfig = typeof appConfig;
