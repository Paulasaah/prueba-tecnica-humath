import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from './errors';
import { logger } from './logger';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const reqId = (req as unknown as { id?: string }).id;

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', issues: err.issues, reqId });
    return;
  }

  if (err instanceof AppError) {
    logger.warn({ reqId, code: err.code }, err.message);
    res.status(err.status).json({ error: err.message, code: err.code, reqId });
    return;
  }

  logger.error({ err, reqId }, 'unhandled error');
  res.status(500).json({ error: 'Internal Server Error', reqId });
};
