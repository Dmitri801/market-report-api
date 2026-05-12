import { Pool } from 'pg';
import type { MarketReport } from './schema.js';

let pool: Pool | null = null;

export interface StoredReport extends MarketReport {
  id: number;
  createdAt: string;
}

export async function initDb(databaseUrl: string): Promise<void> {
  if (pool) {
    return;
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to connect to the database');
  }

  pool = new Pool({ connectionString: databaseUrl });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      as_of TEXT NOT NULL,
      timezone TEXT NOT NULL,
      market_bias TEXT NOT NULL,
      premarket_report TEXT NOT NULL DEFAULT '',
      top_pick JSONB NOT NULL,
      additional_picks JSONB NOT NULL,
      risk_reminder TEXT NOT NULL,
      source TEXT,
      run_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS premarket_report TEXT NOT NULL DEFAULT ''`);
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='reports' AND column_name='premarket_report' AND data_type='jsonb'
      ) THEN
        ALTER TABLE reports
          ALTER COLUMN premarket_report TYPE TEXT
          USING CASE
            WHEN jsonb_typeof(premarket_report)='object' THEN COALESCE(premarket_report->>'summary', premarket_report::text)
            WHEN jsonb_typeof(premarket_report)='string' THEN trim(both '"' from premarket_report::text)
            ELSE premarket_report::text
          END;
      END IF;
    END$$;
  `);
}

function assertDb() {
  if (!pool) {
    throw new Error('Database not initialised. Call initDb first.');
  }
  return pool;
}

function formatCreatedAt(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function saveReport(report: MarketReport): Promise<StoredReport> {
  const database = assertDb();
  const result = await database.query(
    `INSERT INTO reports (as_of, timezone, market_bias, premarket_report, top_pick, additional_picks, risk_reminder, source, run_id)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9)
     RETURNING id, created_at`,
    [
      report.asOf,
      report.timezone,
      report.marketBias,
      report.premarketReport,
      JSON.stringify(report.topPick),
      JSON.stringify(report.additionalPicks),
      report.riskReminder,
      report.source ?? null,
      report.runId ?? null,
    ]
  );

  const row = result.rows[0];
  return {
    ...report,
    id: Number(row.id),
    createdAt: formatCreatedAt(row.created_at),
  };
}

export async function getLatestReport(): Promise<StoredReport | null> {
  const database = assertDb();
  const result = await database.query('SELECT * FROM reports ORDER BY id DESC LIMIT 1');
  if (result.rows.length === 0) return null;
  return mapRowToReport(result.rows[0]);
}

export async function getHistory(limit = 10): Promise<StoredReport[]> {
  const database = assertDb();
  const result = await database.query('SELECT * FROM reports ORDER BY id DESC LIMIT $1', [limit]);
  return result.rows.map(mapRowToReport);
}

function mapRowToReport(row: any): StoredReport {
  return {
    id: Number(row.id),
    asOf: row.as_of,
    timezone: row.timezone,
    marketBias: row.market_bias,
    premarketReport: row.premarket_report,
    topPick: row.top_pick,
    additionalPicks: row.additional_picks,
    riskReminder: row.risk_reminder,
    source: row.source ?? undefined,
    runId: row.run_id ?? undefined,
    createdAt: formatCreatedAt(row.created_at),
  };
}
