/**
 * Authentication Controller
 * Handles user authentication via Emergent OAuth
 */
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { User, UserSession } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');
const env = require('../config/env');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeNameFromEmail = (email) => {
  const localPart = String(email || '').split('@')[0] || 'User';
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
};

const createPasswordHash = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
};

const verifyPassword = (password, storedHash) => {
  if (!storedHash || !storedHash.startsWith('scrypt$')) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const [, salt, hash] = parts;
  const hashedInput = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(hashedInput, 'hex')
  );
};

const createSessionForUser = async (res, user) => {
  const sessionToken = `sess_${uuidv4().replace(/-/g, '')}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await UserSession.create({
    user_id: user.user_id,
    session_token: sessionToken,
    expires_at: expiresAt,
  });

  res.cookie('session_token', sessionToken, {
    httpOnly: true,
    secure: env.isProduction(),
    sameSite: env.isProduction() ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return sessionToken;
};

/**
 * POST /api/auth/session
 * Exchange Emergent OAuth session_id for app session
 */
const createSession = async (req, res) => {
  try {
    const { session_id } = req.body;
    
    if (!session_id) {
      return sendError(res, 'session_id required', 400);
    }
    
    // Call Emergent Auth to get user data
    const authResponse = await axios.get(
      'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
      { headers: { 'X-Session-ID': session_id } }
    );
    
    const userData = authResponse.data;
    
    if (!userData || !userData.email) {
      return sendError(res, 'Invalid session_id', 401);
    }
    
    // Find or create user
    let user = await User.findOne({ email: userData.email });
    
    if (user) {
      // Update existing user
      user.name = userData.name;
      user.picture = userData.picture || user.picture;
      user.auth_provider = user.auth_provider || 'emergent';
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        auth_provider: 'emergent',
      });
    }

    const sessionToken = await createSessionForUser(res, user);
    
    logger.info(`User logged in: ${user.email}`);
    
    return sendSuccess(res, {
      user: user.toJSON(),
      session_token: sessionToken,
    }, 'Login successful');
    
  } catch (error) {
    logger.error('Create session error:', error.message);
    
    if (error.response?.status === 401 || error.response?.status === 400) {
      return sendError(res, 'Invalid session_id', 401);
    }
    
    return sendError(res, 'Authentication failed', 500);
  }
};

/**
 * POST /api/auth/signup
 * Signup with email and password
 */
const signupWithEmail = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedName = String(name || '').trim();

    if (!normalizedEmail || !password) {
      return sendError(res, 'email and password are required', 400);
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return sendError(res, 'Invalid email format', 400);
    }
    if (String(password).length < 8) {
      return sendError(res, 'Password must be at least 8 characters', 400);
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return sendError(res, 'Email already registered', 409);
    }

    const user = await User.create({
      email: normalizedEmail,
      name: normalizedName || normalizeNameFromEmail(normalizedEmail),
      password_hash: createPasswordHash(String(password)),
      auth_provider: 'email',
    });

    const sessionToken = await createSessionForUser(res, user);
    logger.info(`User signed up: ${user.email}`);
    return sendSuccess(res, {
      user: user.toJSON(),
      session_token: sessionToken,
    }, 'Signup successful');
  } catch (error) {
    logger.error('Signup error:', error.message);
    return sendError(res, 'Signup failed', 500);
  }
};

/**
 * POST /api/auth/login
 * Login with email and password
 */
const loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return sendError(res, 'email and password are required', 400);
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.password_hash) {
      return sendError(res, 'Invalid credentials', 401);
    }

    if (!verifyPassword(String(password), user.password_hash)) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const sessionToken = await createSessionForUser(res, user);
    logger.info(`User logged in with email: ${user.email}`);
    return sendSuccess(res, {
      user: user.toJSON(),
      session_token: sessionToken,
    }, 'Login successful');
  } catch (error) {
    logger.error('Email login error:', error.message);
    return sendError(res, 'Login failed', 500);
  }
};

/**
 * POST /api/auth/google
 * Login/signup with Google ID token
 */
const loginWithGoogle = async (req, res) => {
  try {
    const { id_token } = req.body || {};
    if (!id_token) {
      return sendError(res, 'id_token required', 400);
    }

    const tokenInfoResponse = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      params: { id_token },
    });
    const tokenInfo = tokenInfoResponse.data || {};

    if (!tokenInfo.email || tokenInfo.email_verified !== 'true') {
      return sendError(res, 'Google account email is not verified', 401);
    }

    if (env.GOOGLE_CLIENT_ID && tokenInfo.aud !== env.GOOGLE_CLIENT_ID) {
      return sendError(res, 'Google token audience mismatch', 401);
    }

    const normalizedEmail = String(tokenInfo.email).toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        name: tokenInfo.name || normalizeNameFromEmail(normalizedEmail),
        picture: tokenInfo.picture || null,
        auth_provider: 'google',
        google_sub: tokenInfo.sub || null,
      });
    } else {
      user.name = tokenInfo.name || user.name;
      user.picture = tokenInfo.picture || user.picture;
      user.google_sub = tokenInfo.sub || user.google_sub;
      if (!user.auth_provider) {
        user.auth_provider = 'google';
      }
      await user.save();
    }

    const sessionToken = await createSessionForUser(res, user);
    logger.info(`User logged in with Google: ${user.email}`);
    return sendSuccess(res, {
      user: user.toJSON(),
      session_token: sessionToken,
    }, 'Google login successful');
  } catch (error) {
    logger.error('Google login error:', error.message);
    return sendError(res, 'Google authentication failed', 401);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
const getCurrentUser = async (req, res) => {
  return sendSuccess(res, req.user, 'User retrieved');
};

/**
 * POST /api/auth/logout
 * Logout and clear session
 */
const logout = async (req, res) => {
  try {
    const sessionToken = req.cookies?.session_token || req.sessionToken;
    
    if (sessionToken) {
      await UserSession.deleteOne({ session_token: sessionToken });
    }
    
    res.clearCookie('session_token', { path: '/' });
    
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    logger.error('Logout error:', error);
    return sendError(res, 'Logout failed', 500);
  }
};

module.exports = {
  createSession,
  signupWithEmail,
  loginWithEmail,
  loginWithGoogle,
  getCurrentUser,
  logout,
};
