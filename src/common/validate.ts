import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateParams = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    req.params = schema.parse(req.params) as any;
    next();
  } catch (err) {
    next(err);
  }
};

export const validateQuery = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    req.query = schema.parse(req.query) as any;
    next();
  } catch (err) {
    next(err);
  }
};

export const validateBody = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    next(err);
  }
};
