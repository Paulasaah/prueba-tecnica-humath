import { Router, Response, NextFunction } from 'express';
import { MarketService } from './market.service';
import { requireJwt, AuthedRequest } from '../auth/jwt.middleware';
import { validateParams, validateQuery } from '../../common/validate';
import * as dto from './market.dto';

export class MarketController {
  public router = Router();
  constructor(private readonly service = new MarketService()) {
    this.router.use(requireJwt);
    this.router.get('/quote/:symbol', validateParams(dto.symbolParam), this.quote);
    this.router.get('/daily/:symbol', validateParams(dto.symbolParam), validateQuery(dto.dailyQuery), this.daily);
  }

  quote = async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.getQuote(req.params.symbol as string, req.userId));
    } catch (e) {
      next(e);
    }
  };

  daily = async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const size = req.query.outputsize as 'compact' | 'full';
      res.json(await this.service.getDaily(req.params.symbol as string, size, req.userId));
    } catch (e) {
      next(e);
    }
  };
}
