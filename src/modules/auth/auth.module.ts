import { Router } from 'express';
import { AuthController } from './auth.controller';
import { jwtAuth } from './jwt.middleware';

export function authRouter(): Router {
  const router = Router();
  const controller = new AuthController();

  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.get('/me', jwtAuth, controller.me);

  return router;
}
