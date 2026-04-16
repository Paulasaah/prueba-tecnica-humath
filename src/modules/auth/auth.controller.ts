import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthService } from './auth.service';
import { loginSchema, registerSchema } from './auth.dto';
import { validateBody } from '../../common/validate';
import { requireJwt, AuthedRequest } from './jwt.middleware';

const authLimiter = rateLimit({ windowMs: 60_000, max: 10 });

export class AuthController {
  public router = Router();
  constructor(private readonly service = new AuthService()) {
    this.router.post('/register', authLimiter, validateBody(registerSchema), this.register);
    this.router.post('/login', authLimiter, validateBody(loginSchema), this.login);
    this.router.get('/me', requireJwt, this.me);
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await this.service.register(req.body.email, req.body.password));
    } catch (e) {
      next(e);
    }
  };
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.login(req.body.email, req.body.password));
    } catch (e) {
      next(e);
    }
  };
  me = async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.me(req.userId!));
    } catch (e) {
      next(e);
    }
  };
}
