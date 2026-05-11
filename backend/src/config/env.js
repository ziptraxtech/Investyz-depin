/**
 * Environment Configuration
 * Loads and validates environment variables
 */
require('dotenv').config();

const env = {
  // Server
  PORT: process.env.PORT || 8001,
  HOST: process.env.HOST || 'localhost',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI?.trim() || '',
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017',
  DB_NAME: process.env.DB_NAME || 'test_database',
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // CORS
  CORS_ORIGINS: process.env.CORS_ORIGINS || '*',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
  JWT_EXPIRES_IN_SECONDS: Number(process.env.JWT_EXPIRES_IN_SECONDS || 7 * 24 * 60 * 60),
  
  // Stripe
  STRIPE_API_KEY: process.env.STRIPE_API_KEY?.trim() || '',

  // Cashfree Secure ID / DigiLocker
  CASHFREE_CLIENT_ID: process.env.CASHFREE_CLIENT_ID?.trim() || '',
  CASHFREE_CLIENT_SECRET: process.env.CASHFREE_CLIENT_SECRET?.trim() || '',
  CASHFREE_ENV: process.env.CASHFREE_ENV?.trim() || 'sandbox',
  CASHFREE_REDIRECT_URL: process.env.CASHFREE_REDIRECT_URL?.trim() || '',

  // Decentro Sandbox KYC
  DECENTRO_BASE_URL: process.env.DECENTRO_BASE_URL?.trim() || 'https://in.staging.decentro.tech',
  DECENTRO_CLIENT_ID: process.env.DECENTRO_CLIENT_ID?.trim() || '',
  DECENTRO_CLIENT_SECRET: process.env.DECENTRO_CLIENT_SECRET?.trim() || '',
  DECENTRO_MODULE_SECRET: process.env.DECENTRO_MODULE_SECRET?.trim() || '',
  DECENTRO_PROVIDER_SECRET: process.env.DECENTRO_PROVIDER_SECRET?.trim() || '',
  DECENTRO_REDIRECT_URL: process.env.DECENTRO_REDIRECT_URL?.trim() || '',
  KYC_MOCK_MODE: process.env.KYC_MOCK_MODE !== 'false',

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.trim() || '',
  
  // Wallet Configuration
  wallets: {
    METAMASK_ENABLED: process.env.METAMASK_ENABLED === 'true',
    TRUST_WALLET_ENABLED: process.env.TRUST_WALLET_ENABLED === 'true',
    WALLETCONNECT_ENABLED: process.env.WALLETCONNECT_ENABLED === 'true',
    WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID || '',
    SUPPORTED_CHAIN_IDS: (process.env.SUPPORTED_CHAIN_IDS || '1,137,56').split(',').map(Number),
  },
  
  // Helper methods
  isDevelopment: () => env.NODE_ENV === 'development',
  isProduction: () => env.NODE_ENV === 'production',
};

module.exports = env;
