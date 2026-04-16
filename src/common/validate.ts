import { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';

export const validateBody = (schema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return next(result.error);
  req.body = result.data;
  next();
};

export const validateParams = (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.params);
  if (!result.success) return next(result.error);
  res.locals.params = result.data;
  next();
};

export const validateQuery = (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.query);
  if (!result.success) return next(result.error);
  res.locals.query = result.data;
  next();
};
