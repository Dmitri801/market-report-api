import { z } from 'zod';

export const biasEnum = z.enum(['bullish', 'bearish']);
export const tradeTypeEnum = z.enum([
  'breakout',
  'support_bounce',
  'resistance_rejection',
  'trend_continuation',
]);

export const topPickSchema = z.object({
  symbol: z.string().min(1),
  bias: biasEnum,
  tradeType: tradeTypeEnum,
  entry: z.string().min(1),
  target1: z.string().min(1),
  target2: z.string().min(1),
  invalidation: z.string().min(1),
  reasoning: z.string().min(1),
});

export const additionalPickSchema = z.object({
  symbol: z.string().min(1),
  bias: biasEnum,
  tradeType: tradeTypeEnum,
  entry: z.string().min(1),
  target1: z.string().min(1),
  target2: z.string().min(1),
  invalidation: z.string().min(1),
  setup: z.string().min(1),
});

export const marketReportSchema = z.object({
  asOf: z.string().min(1),
  timezone: z.string().min(1),
  premarketReport: z.string().min(1),
  marketBias: z.string().min(1),
  topPick: topPickSchema,
  additionalPicks: z.array(additionalPickSchema).length(5),
  riskReminder: z.string().min(1),
  source: z.string().optional(),
  runId: z.string().optional(),
});

export type MarketReport = z.infer<typeof marketReportSchema>;
