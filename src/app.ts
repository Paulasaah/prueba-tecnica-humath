import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { randomUUID } from 'node:crypto';
import { logger } from './common/logger';
import { errorHandler } from './common/error-handler';
import { AppDataSource } from './common/database';
import { openApiSpec } from './common/swagger';
import { authRouter } from './modules/auth/auth.module';
import { marketRouter } from './modules/market/market.module';
import { MarketController } from './modules/market/market.controller';

export function createApp(): Express {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      originAgentCluster: false,
    }),
  );
  app.use(cors());
  app.use(compression());

  app.use(
    rateLimit({
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
      max: Number(process.env.RATE_LIMIT_MAX ?? 60),
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers['x-request-id']?.toString() ?? randomUUID(),
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/ready', async (_req, res) => {
    try {
      await AppDataSource.query('SELECT 1');
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'degraded' });
    }
  });

  const marketCtrl = new MarketController();
  app.get('/external-data', marketCtrl.externalData);

  app.get('/api/docs/swagger.json', (_req, res) => {
    res.json(openApiSpec);
  });
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, { swaggerOptions: { url: '/api/docs/swagger.json' } }),
  );
  app.use('/api/auth', authRouter());
  app.use('/api/market', marketRouter());

  app.use(errorHandler);
  return app;
}
