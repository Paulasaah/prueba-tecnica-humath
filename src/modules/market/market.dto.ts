import { z } from 'zod';

export const symbolParam = z.object({
  symbol: z.string().toUpperCase().min(1).max(16),
});

export const dailyQuery = z.object({
  outputsize: z.enum(['compact', 'full']).default('compact'),
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

export interface ExternalDataItemDTO {
  id: number;
  name: string;
  priceChange: number;
  changePercent: string;
}

export interface AlphaVantageQuote {
  'Global Quote': Record<string, string>;
}
