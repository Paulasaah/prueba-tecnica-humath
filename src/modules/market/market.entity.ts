import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('market_query_log')
export class MarketQueryLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar' })
  userId!: string;

  @Column({ type: 'varchar' })
  endpoint!: string;

  @Column({ type: 'varchar', nullable: true })
  symbol?: string;

  @Column({ type: 'boolean', default: false })
  cached!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  queriedAt!: Date;
}
