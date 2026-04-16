import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../common/errors';

export interface AuthedRequest extends Request {
  userId?: string;
}

export function requireJwt(req: AuthedRequest, _res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return next(new UnauthorizedError('Missing token'));
  try {
    const { sub } = jwt.verify(h.slice(7), process.env.JWT_SECRET!) as { sub: string };
    req.userId = sub;
    next();
  } catch {
    next(new UnauthorizedError('Invalid token'));
  }
}
