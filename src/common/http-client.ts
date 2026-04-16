import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { cache } from './cache';
import { TooManyRequestsError, AppError } from './errors';
import { logger } from './logger';

class HttpClient {
  private readonly axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: process.env.ALPHA_VANTAGE_BASE_URL,
      timeout: 10_000,
      params: { apikey: process.env.ALPHA_VANTAGE_KEY },
    });

    this.axios.interceptors.response.use(
      (r) => r,
      (err) => {
        logger.warn({ msg: 'Alpha Vantage error', err: err.message });
        return Promise.reject(err);
      },
    );
  }

  async get<T>(params: Record<string, string>, config?: AxiosRequestConfig): Promise<T> {
    const key = this.cacheKey(params);
    const cached = cache.get<T>(key);
    if (cached) {
      logger.debug({ key }, 'cache hit');
      return cached;
    }

    const { data } = await this.axios.get<T>('', {
      ...config,
      params: { ...config?.params, ...params },
    });
    this.assertNotRateLimited(data);
    cache.set(key, data);
    return data;
  }

  private cacheKey(params: Record<string, string>) {
    return Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
  }

  private assertNotRateLimited(data: unknown) {
    const d = data as { Note?: string; Information?: string; 'Error Message'?: string };
    if (d?.Note || d?.Information) throw new TooManyRequestsError('Alpha Vantage rate limit reached');
    if (d?.['Error Message']) throw new AppError(502, d['Error Message'], 'UPSTREAM_ERROR');
  }
}

export const httpClient = new HttpClient();
