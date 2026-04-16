import { Router } from 'express';
import { MarketController } from './market.controller';
import { jwtAuth } from '../auth/jwt.middleware';

export function marketRouter(): Router {
  const router = Router();
  const controller = new MarketController();

  router.get('/quote/:symbol', jwtAuth, controller.quote);
  router.get('/daily/:symbol', jwtAuth, controller.daily);

  return router;
}
