import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppDataSource } from '../../common/database';
import { User } from './auth.entity';
import { UnauthorizedError, BadRequestError } from '../../common/errors';

export class AuthService {
  private get repo() {
    return AppDataSource.getRepository(User);
  }

  async register(email: string, password: string) {
    if (await this.repo.findOne({ where: { email } })) {
      throw new BadRequestError('Email already used');
    }
    const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
    const passwordHash = await bcrypt.hash(password, rounds);
    const user = await this.repo.save({ email, passwordHash });
    return { id: user.id, email: user.email };
  }

  async login(email: string, password: string) {
    const user = await this.repo.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid credentials');
    }
    const token = jwt.sign({ sub: user.id, email }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    } as SignOptions);
    return { token, user: { id: user.id, email: user.email } };
  }

  async me(userId: string) {
    const user = await this.repo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedError();
    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }
}
