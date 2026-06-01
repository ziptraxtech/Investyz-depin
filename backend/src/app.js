/**
 * Express Application Setup
 * Configures middleware and routes
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const { createRateLimiter, sanitizeInput } = require('./middlewares/security.middleware');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
const allowedOrigins = env.CORS_ORIGINS === '*'
  ? ['*']
  : env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);

const isNgrokOrigin = (origin) => {
  try {
    const parsed = new URL(origin);
    return (
      parsed.protocol === 'https:' &&
      (
        parsed.hostname.endsWith('.ngrok-free.app') ||
        parsed.hostname.endsWith('.ngrok-free.dev') ||
        parsed.hostname.endsWith('.ngrok.io')
      )
    );
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (env.isDevelopment() && isNgrokOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-Clerk-User-Data'],
};
app.use(cors(corsOptions));

// Request parsing
const captureRawBody = (req, res, buffer) => {
  if (buffer?.length) {
    req.rawBody = buffer.toString('utf8');
  }
};

app.use(express.json({ limit: '10mb', verify: captureRawBody }));
app.use(express.urlencoded({ extended: true, verify: captureRawBody }));
app.use(cookieParser());
app.use(sanitizeInput);
app.use(createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests. Please try again shortly.',
}));

// Logging
if (env.isDevelopment()) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API routes with /api prefix
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
