/**
 * Authentication Middleware
 * Validates session tokens and attaches user to request
 */
const { User, UserSession } = require('../models');
const { sendError } = require('../utils/response');
const logger = require('../utils/logger');
const jwt = require('../utils/jwt');
const {
  findOrCreateUserFromClerk,
  parseClerkUserData,
  verifyClerkToken,
} = require('../utils/clerk');

/**
 * Extract session token from request
 */
const extractToken = (req) => {
  // Check cookie first
  if (req.cookies && req.cookies.session_token) {
    return req.cookies.session_token;
  }
  
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};

/**
 * Authentication middleware - requires valid session
 */
const requireAuth = async (req, res, next) => {
  try {
    const sessionToken = extractToken(req);
    
    if (!sessionToken) {
      return sendError(res, 'Authentication required', 401);
    }
    
    let userId = null;
    let session = null;

    if (sessionToken.startsWith('sess_')) {
      session = await UserSession.findOne({ session_token: sessionToken });
      if (!session) return sendError(res, 'Invalid session', 401);
      if (new Date(session.expires_at) < new Date()) {
        await UserSession.deleteOne({ session_token: sessionToken });
        return sendError(res, 'Session expired', 401);
      }
      userId = session.user_id;
    } else {
      try {
        const payload = jwt.verify(sessionToken);
        userId = payload.sub;
      } catch (jwtError) {
        const clerkClaims = await verifyClerkToken(sessionToken);
        const clerkUserData = parseClerkUserData(req.headers['x-clerk-user-data']);
        const clerkUser = await findOrCreateUserFromClerk({
          claims: clerkClaims,
          userData: clerkUserData,
        });

        req.user = clerkUser.toJSON();
        req.sessionToken = sessionToken;
        req.authSource = 'clerk';
        return next();
      }
    }

    const user = await User.findOne({ user_id: userId });
    
    if (!user) {
      return sendError(res, 'User not found', 401);
    }
    
    // Attach user to request
    req.user = user.toJSON();
    req.sessionToken = sessionToken;
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    const message = String(error?.message || '');
    const isAuthError =
      message.includes('Invalid') ||
      message.includes('expired') ||
      message.includes('mismatch') ||
      message.includes('missing') ||
      message.includes('Unable to fetch Clerk JWKS');
    return sendError(res, 'Authentication failed', isAuthError ? 401 : 500);
  }
};

const requireKycVerified = (req, res, next) => {
  if (!req.user?.isKycVerified || req.user?.kycStatus !== 'VERIFIED') {
    return sendError(res, 'KYC verification required before investing', 403, {
      kycStatus: req.user?.kycStatus || 'NOT_STARTED',
    });
  }
  return next();
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return sendError(res, 'Admin access required', 403);
  }
  return next();
};

/**
 * Optional authentication - attaches user if valid session exists
 */
const optionalAuth = async (req, res, next) => {
  try {
    const sessionToken = extractToken(req);
    
    if (sessionToken) {
      if (sessionToken.startsWith('sess_')) {
        const session = await UserSession.findOne({ session_token: sessionToken });
        
        if (session && new Date(session.expires_at) > new Date()) {
          const user = await User.findOne({ user_id: session.user_id });
          if (user) {
            req.user = user.toJSON();
            req.sessionToken = sessionToken;
          }
        }
      } else {
        try {
          const payload = jwt.verify(sessionToken);
          const user = await User.findOne({ user_id: payload.sub });
          if (user) {
            req.user = user.toJSON();
            req.sessionToken = sessionToken;
          }
        } catch {
          try {
            const clerkClaims = await verifyClerkToken(sessionToken);
            const clerkUserData = parseClerkUserData(req.headers['x-clerk-user-data']);
            const clerkUser = await findOrCreateUserFromClerk({
              claims: clerkClaims,
              userData: clerkUserData,
            });
            req.user = clerkUser.toJSON();
            req.sessionToken = sessionToken;
            req.authSource = 'clerk';
          } catch {
            // Ignore invalid optional auth.
          }
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without auth on error
    next();
  }
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireKycVerified,
  requireAdmin,
  extractToken,
};
