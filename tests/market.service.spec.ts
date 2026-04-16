import 'reflect-metadata';

jest.mock('../src/common/http-client', () => ({
  httpClient: { get: jest.fn() },
}));

jest.mock('../src/common/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({ save: jest.fn().mockResolvedValue(undefined) })),
  },
}));

import { httpClient } from '../src/common/http-client';
import { MarketService } from '../src/modules/market/market.service';
import { NotFoundError } from '../src/common/errors';

const mockedGet = httpClient.get as jest.Mock;

describe('MarketService', () => {
  beforeEach(() => mockedGet.mockReset());

  describe('getQuote', () => {
    it('transforma Global Quote → DTO camelCase', async () => {
      mockedGet.mockResolvedValue({
        'Global Quote': {
          '01. symbol': 'IBM',
          '05. price': '150.25',
          '06. volume': '1000000',
          '07. latest trading day': '2026-04-15',
          '09. change': '1.25',
          '10. change percent': '0.84%',
        },
      });

      const out = await new MarketService().getQuote('IBM');

      expect(out).toEqual({
        symbol: 'IBM',
        price: 150.25,
        change: 1.25,
        changePercent: '0.84%',
        volume: 1000000,
        latestTradingDay: '2026-04-15',
      });
    });

    it('lanza NotFoundError cuando el símbolo no existe', async () => {
      mockedGet.mockResolvedValue({ 'Global Quote': {} });
      await expect(new MarketService().getQuote('NOPE')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('getExternalData (endpoint del enunciado)', () => {
    it('transforma top_gainers → [{id, name, priceChange, changePercent}]', async () => {
      mockedGet.mockResolvedValue({
        top_gainers: [
          { ticker: 'AAPL', change_amount: '3.25', change_percentage: '1.2%', price: '180' },
          { ticker: 'TSLA', change_amount: '5.50', change_percentage: '2.5%', price: '220' },
        ],
      });

      const out = await new MarketService().getExternalData();

      expect(out).toEqual([
        { id: 1, name: 'AAPL', priceChange: 3.25, changePercent: '1.2%' },
        { id: 2, name: 'TSLA', priceChange: 5.5, changePercent: '2.5%' },
      ]);
    });

    it('retorna [] si no hay gainers', async () => {
      mockedGet.mockResolvedValue({});
      const out = await new MarketService().getExternalData();
      expect(out).toEqual([]);
    });
  });
});
