import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../modules/auth/auth.entity';
import { MarketQueryLog } from '../modules/market/market.entity';

const useSsl = process.env.DB_SSL === 'true' || /neon\.tech|azure\.com/.test(process.env.DATABASE_URL ?? '');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  entities: [User, MarketQueryLog],
  migrations: ['dist/migrations/*.js'],
  synchronize: process.env.DB_SYNC === 'true' || process.env.NODE_ENV === 'development',
  logging: false,
});
