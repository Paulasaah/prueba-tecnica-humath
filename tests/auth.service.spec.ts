import 'reflect-metadata';

const mockFindOne = jest.fn();
const mockSave = jest.fn();

jest.mock('../src/common/database', () => ({
  AppDataSource: {
    getRepository: () => ({ findOne: mockFindOne, save: mockSave }),
  },
}));

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../src/modules/auth/auth.service';
import { BadRequestError, UnauthorizedError } from '../src/common/errors';

describe('AuthService', () => {
  beforeEach(() => {
    mockFindOne.mockReset();
    mockSave.mockReset();
  });

  it('register hashea password y persiste', async () => {
    mockFindOne.mockResolvedValue(null);
    mockSave.mockResolvedValue({ id: 'uuid-1', email: 'a@b.c' });

    const out = await new AuthService().register('a@b.c', 'password123');

    expect(out).toEqual({ id: 'uuid-1', email: 'a@b.c' });
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'a@b.c', passwordHash: expect.any(String) }),
    );
    const call = mockSave.mock.calls[0][0];
    expect(call.passwordHash).not.toBe('password123');
  });

  it('register rechaza email duplicado', async () => {
    mockFindOne.mockResolvedValue({ id: 'x', email: 'a@b.c' });
    await expect(new AuthService().register('a@b.c', 'password123')).rejects.toBeInstanceOf(BadRequestError);
  });

  it('login emite JWT válido cuando credenciales son correctas', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    mockFindOne.mockResolvedValue({ id: 'uuid-1', email: 'a@b.c', passwordHash });

    const out = await new AuthService().login('a@b.c', 'password123');

    expect(out.user).toEqual({ id: 'uuid-1', email: 'a@b.c' });
    const payload = jwt.verify(out.token, process.env.JWT_SECRET as string) as { sub: string; email: string };
    expect(payload.sub).toBe('uuid-1');
    expect(payload.email).toBe('a@b.c');
  });

  it('login lanza UnauthorizedError con credenciales inválidas', async () => {
    mockFindOne.mockResolvedValue(null);
    await expect(new AuthService().login('x@y.z', 'wrong-pass')).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
