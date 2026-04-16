import NodeCache from 'node-cache';

const ttl = Number(process.env.ALPHA_VANTAGE_CACHE_TTL_SECONDS ?? 60);
export const cache = new NodeCache({ stdTTL: ttl, checkperiod: 30, useClones: false });
