const crypto = require('crypto');
const env = require('../config/env');

const base64UrlEncode = (value) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

const base64UrlDecode = (value) =>
  JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

const sign = (payload, expiresInSeconds = env.JWT_EXPIRES_IN_SECONDS) => {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const encoded = `${base64UrlEncode(header)}.${base64UrlEncode(body)}`;
  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(encoded)
    .digest('base64url');

  return `${encoded}.${signature}`;
};

const verify = (token) => {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT');
  }

  const [header, body, signature] = parts;
  const expected = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  if (signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    throw new Error('Invalid JWT signature');
  }

  const payload = base64UrlDecode(body);
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('JWT expired');
  }

  return payload;
};

module.exports = { sign, verify };
