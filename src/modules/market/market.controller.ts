import { Request, Response, NextFunction } from 'express';
import { MarketService } from './market.service';
import { symbolParam, dailyQuery } from './market.dto';
import { AuthRequest } from '../auth/jwt.middleware';

export class MarketController {
  constructor(private readonly service = new MarketService()) {}

  externalData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getExternalData();
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  quote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { symbol } = symbolParam.parse(req.params);
      const data = await this.service.getQuote(symbol, req.user?.sub);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  daily = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { symbol } = symbolParam.parse(req.params);
      const { outputsize } = dailyQuery.parse(req.query);
      const data = await this.service.getDaily(symbol, outputsize, req.user?.sub);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };
}
