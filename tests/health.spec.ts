import 'reflect-metadata';
import request from 'supertest';

jest.mock('../src/common/database', () => ({
  AppDataSource: {
    initialize: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([{ one: 1 }]),
    getRepository: jest.fn(() => ({
      findOne: jest.fn(),
      save: jest.fn(),
    })),
  },
}));

jest.mock('../src/common/http-client', () => ({
  httpClient: { get: jest.fn() },
}));

import { createApp } from '../src/app';

describe('Health endpoints', () => {
  const app = createApp();

  it('GET /health → 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /ready → 200 when DB responds', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });

  it('GET /api/docs → 200 (swagger UI)', async () => {
    const res = await request(app).get('/api/docs/').redirects(0);
    expect([200, 301]).toContain(res.status);
  });
});
