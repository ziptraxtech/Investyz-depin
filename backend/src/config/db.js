/**
 * MongoDB Database Connection
 * Uses Mongoose for MongoDB operations
 */
const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

const buildMongoUri = () => {
  if (env.MONGODB_URI) return env.MONGODB_URI;

  try {
    const parsed = new URL(env.MONGO_URL);
    const hasDatabasePath = parsed.pathname && parsed.pathname !== '/';
    if (hasDatabasePath) return env.MONGO_URL;

    parsed.pathname = `/${env.DB_NAME}`;
    return parsed.toString();
  } catch {
    const [base, query] = env.MONGO_URL.split('?');
    const normalizedBase = base.replace(/\/+$/, '');
    return `${normalizedBase}/${env.DB_NAME}${query ? `?${query}` : ''}`;
  }
};

const connectDB = async () => {
  try {
    const mongoURI = buildMongoUri();
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoURI, options);
    
    logger.info(`MongoDB connected: ${env.DB_NAME}`);
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
