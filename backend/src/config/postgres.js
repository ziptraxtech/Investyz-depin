const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

let pool;

const hasDatabaseUrl = () => Boolean(env.DATABASE_URL);

const shouldUseSsl = () => {
  if (!hasDatabaseUrl()) return false;
  return env.DATABASE_URL.includes('sslmode=require') || env.NODE_ENV === 'production';
};

const getPool = () => {
  if (!hasDatabaseUrl()) {
    throw new Error('DATABASE_URL is not configured');
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: shouldUseSsl() ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (error) => {
      logger.error('PostgreSQL pool error:', error.message);
    });
  }

  return pool;
};

const testPostgresConnection = async () => {
  if (!hasDatabaseUrl()) {
    logger.warn('DATABASE_URL not configured. PostgreSQL KYC storage is disabled.');
    return false;
  }

  const client = await getPool().connect();
  try {
    await client.query('select 1');
    logger.info('PostgreSQL connection ready for KYC storage');
    return true;
  } finally {
    client.release();
  }
};

module.exports = {
  getPool,
  hasDatabaseUrl,
  testPostgresConnection,
};
