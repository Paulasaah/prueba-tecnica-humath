import { z } from 'zod';

export const symbolParam = z.object({ symbol: z.string().toUpperCase().min(1).max(16) });
export const forexParam = z.object({
  from: z.string().length(3).toUpperCase(),
  to: z.string().length(3).toUpperCase(),
});
export const searchQuery = z.object({ q: z.string().min(1) });
export const dailyQuery = z.object({ outputsize: z.enum(['compact', 'full']).default('compact') });
export const intradayQuery = z.object({
  interval: z.enum(['1min', '5min', '15min', '30min', '60min']).default('5min'),
});
export const indicatorQuery = z.object({
  interval: z
    .enum(['daily', 'weekly', 'monthly', '1min', '5min', '15min', '30min', '60min'])
    .default('daily'),
  time_period: z.coerce.number().int().min(1).max(200).default(14),
  series_type: z.enum(['close', 'open', 'high', 'low']).default('close'),
});

export interface QuoteDTO {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  volume: number;
  latestTradingDay: string;
}

export interface CandleDTO {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ExchangeRateDTO {
  from: string;
  to: string;
  rate: number;
  lastRefreshed: string;
  bid?: number;
  ask?: number;
}

export interface AlphaVantageQuote {
  'Global Quote': Record<string, string>;
}
