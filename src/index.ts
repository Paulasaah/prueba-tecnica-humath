import 'dotenv/config';
import 'reflect-metadata';
import { createApp } from './app';
import { logger } from './common/logger';
import { AppDataSource } from './common/database';

const port = Number(process.env.PORT ?? 3000);

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();
  logger.info('DB connected');

  const app = createApp();
  const server = app.listen(port, () => logger.info({ port }, 'API listening'));

  function shutdown(signal: string): void {
    logger.info({ signal }, 'shutting down');
    server.close(async () => {
      await AppDataSource.destroy();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error(err, 'bootstrap failed');
  process.exit(1);
});
