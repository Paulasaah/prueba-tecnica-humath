import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { loginSchema, registerSchema } from './auth.dto';
import { AuthRequest } from './jwt.middleware';
import { UnauthorizedError } from '../../common/errors';

export class AuthController {
  constructor(private readonly service = new AuthService()) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = registerSchema.parse(req.body);
      const user = await this.service.register(dto.email, dto.password);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = loginSchema.parse(req.body);
      const out = await this.service.login(dto.email, dto.password);
      res.json(out);
    } catch (err) {
      next(err);
    }
  };

  me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const user = await this.service.me(req.user.sub);
      res.json(user);
    } catch (err) {
      next(err);
    }
  };
}
