import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../modules/auth/auth.entity';
import { MarketQueryLog } from '../modules/market/market.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [User, MarketQueryLog],
  migrations: ['dist/migrations/*.js'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: false,
});
