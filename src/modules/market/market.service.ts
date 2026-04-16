import { httpClient } from '../../common/http-client';
import type { QuoteDTO, AlphaVantageQuote, CandleDTO, ExternalDataItemDTO } from './market.dto';
import { NotFoundError } from '../../common/errors';
import { AppDataSource } from '../../common/database';
import { MarketQueryLog } from './market.entity';
import { logger } from '../../common/logger';

interface AlphaVantageTopMovers {
  top_gainers?: Array<{ ticker: string; change_amount: string; change_percentage: string; price: string }>;
}

export class MarketService {
  async getExternalData(): Promise<ExternalDataItemDTO[]> {
    const raw = await httpClient.get<AlphaVantageTopMovers>({ function: 'TOP_GAINERS_LOSERS' });
    const gainers = raw.top_gainers ?? [];
    return gainers.slice(0, 10).map((g, i) => ({
      id: i + 1,
      name: g.ticker,
      priceChange: Number(g.change_amount),
      changePercent: g.change_percentage,
    }));
  }

  async getQuote(symbol: string, userId?: string): Promise<QuoteDTO> {
    const raw = await httpClient.get<AlphaVantageQuote>({ function: 'GLOBAL_QUOTE', symbol });
    const q = raw['Global Quote'];
    if (!q || !q['01. symbol']) throw new NotFoundError(`Symbol ${symbol} not found`);

    const result: QuoteDTO = {
      symbol: q['01. symbol'],
      price: Number(q['05. price']),
      change: Number(q['09. change']),
      changePercent: q['10. change percent'],
      volume: Number(q['06. volume']),
      latestTradingDay: q['07. latest trading day'],
    };

    if (userId) this.logFireAndForget(userId, 'GLOBAL_QUOTE', symbol);
    return result;
  }

  async getDaily(symbol: string, outputsize: 'compact' | 'full', userId?: string): Promise<CandleDTO[]> {
    const raw = await httpClient.get<{ 'Time Series (Daily)': Record<string, Record<string, string>> }>({
      function: 'TIME_SERIES_DAILY',
      symbol,
      outputsize,
    });
    const series = raw['Time Series (Daily)'];
    if (!series) throw new NotFoundError(`No data for ${symbol}`);

    const result: CandleDTO[] = Object.entries(series).map(([date, v]) => ({
      date,
      open: Number(v['1. open']),
      high: Number(v['2. high']),
      low: Number(v['3. low']),
      close: Number(v['4. close']),
      volume: Number(v['5. volume']),
    }));

    if (userId) this.logFireAndForget(userId, 'TIME_SERIES_DAILY', symbol);
    return result;
  }

  private logFireAndForget(userId: string, endpoint: string, symbol?: string, cached = false): void {
    AppDataSource.getRepository(MarketQueryLog)
      .save({ userId, endpoint, symbol, cached })
      .catch((err) => logger.warn({ err, userId, endpoint }, 'failed to persist market query log'));
  }
}
