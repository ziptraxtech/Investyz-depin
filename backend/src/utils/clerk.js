const crypto = require('crypto');
const { User } = require('../models');
const env = require('../config/env');

const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;
const jwksCache = new Map();

const decodeBase64UrlJson = (value) =>
  JSON.parse(Buffer.from(String(value || ''), 'base64url').toString('utf8'));

const parseJwt = (token) => {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  return {
    header: decodeBase64UrlJson(encodedHeader),
    payload: decodeBase64UrlJson(encodedPayload),
    signature: Buffer.from(encodedSignature, 'base64url'),
    signingInput: `${encodedHeader}.${encodedPayload}`,
  };
};

const deriveIssuerFromPublishableKey = (publishableKey) => {
  if (!publishableKey) return '';

  const parts = String(publishableKey).split('_');
  const encodedDomain = parts.slice(2).join('_');
  if (!encodedDomain) return '';

  try {
    const decoded = Buffer.from(encodedDomain, 'base64').toString('utf8').replace(/\$+$/, '');
    return decoded ? `https://${decoded}` : '';
  } catch {
    return '';
  }
};

const getExpectedIssuer = () =>
  env.CLERK_ISSUER || deriveIssuerFromPublishableKey(env.CLERK_PUBLISHABLE_KEY);

const getJwks = async (issuer) => {
  const cached = jwksCache.get(issuer);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.keys;
  }

  const response = await fetch(`${issuer.replace(/\/$/, '')}/.well-known/jwks.json`);
  if (!response.ok) {
    throw new Error(`Unable to fetch Clerk JWKS (${response.status})`);
  }

  const data = await response.json();
  const keys = Array.isArray(data.keys) ? data.keys : [];
  jwksCache.set(issuer, {
    keys,
    expiresAt: Date.now() + JWKS_CACHE_TTL_MS,
  });
  return keys;
};

const verifyClerkToken = async (token) => {
  const parsed = parseJwt(token);
  const { header, payload, signature, signingInput } = parsed;

  if (header.alg !== 'RS256') {
    throw new Error(`Unsupported Clerk JWT algorithm: ${header.alg}`);
  }

  if (!payload.iss || !payload.sub) {
    throw new Error('Invalid Clerk token payload');
  }

  const expectedIssuer = getExpectedIssuer();
  if (expectedIssuer && payload.iss !== expectedIssuer) {
    throw new Error('Clerk token issuer mismatch');
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.nbf && payload.nbf > now) {
    throw new Error('Clerk token not active yet');
  }
  if (payload.exp && payload.exp < now) {
    throw new Error('Clerk token expired');
  }

  const keys = await getJwks(payload.iss);
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) {
    throw new Error('Matching Clerk signing key not found');
  }

  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const verified = crypto.verify(
    'RSA-SHA256',
    Buffer.from(signingInput),
    publicKey,
    signature
  );

  if (!verified) {
    throw new Error('Invalid Clerk token signature');
  }

  return payload;
};

const parseClerkUserData = (headerValue) => {
  if (!headerValue) return null;

  try {
    const decoded = Buffer.from(String(headerValue), 'base64url').toString('utf8');
    const value = JSON.parse(decoded);
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
};

const buildNameFromEmail = (email) => {
  const localPart = String(email || '').split('@')[0] || 'Investor';
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
};

const resolveClerkProfile = ({ claims, userData = null }) => {
  const email =
    claims.email ||
    claims.email_address ||
    claims.primary_email_address ||
    userData?.email ||
    '';

  if (!email) {
    throw new Error('Clerk-authenticated user is missing an email address');
  }

  const name =
    userData?.name ||
    claims.name ||
    [claims.given_name, claims.family_name].filter(Boolean).join(' ').trim() ||
    buildNameFromEmail(email);

  return {
    clerkSub: claims.sub,
    email: String(email).trim().toLowerCase(),
    name,
    picture: userData?.picture || claims.picture || claims.image_url || null,
    phone: userData?.phone || claims.phone_number || null,
    emailVerified: userData?.email_verified !== false,
    phoneVerified: Boolean(userData?.phone_verified),
  };
};

const findOrCreateUserFromClerk = async ({ claims, userData = null }) => {
  const profile = resolveClerkProfile({ claims, userData });

  let user = await User.findOne({
    $or: [
      { clerk_sub: profile.clerkSub },
      { email: profile.email },
    ],
  });

  if (!user) {
    user = await User.create({
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      phone: profile.phone,
      auth_provider: 'clerk',
      clerk_sub: profile.clerkSub,
      email_verified: profile.emailVerified,
      phone_verified: profile.phoneVerified,
    });
    return user;
  }

  user.email = profile.email;
  user.name = profile.name || user.name;
  user.picture = profile.picture || user.picture;
  user.phone = profile.phone || user.phone;
  user.auth_provider = 'clerk';
  user.clerk_sub = profile.clerkSub;
  user.email_verified = profile.emailVerified || user.email_verified;
  user.phone_verified = profile.phoneVerified || user.phone_verified;
  await user.save();

  return user;
};

module.exports = {
  findOrCreateUserFromClerk,
  parseClerkUserData,
  verifyClerkToken,
};
