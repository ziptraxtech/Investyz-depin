const crypto = require('crypto');
const env = require('../config/env');

const getEncryptionKey = () => {
  const raw = env.KYC_ENCRYPTION_KEY || '';
  if (!raw) return null;

  try {
    const key = Buffer.from(raw, 'base64');
    if (key.length === 32) return key;
  } catch {
    // Ignore invalid base64 and try UTF-8.
  }

  const utf8Key = Buffer.from(raw, 'utf8');
  if (utf8Key.length === 32) return utf8Key;
  throw new Error('KYC_ENCRYPTION_KEY must decode to exactly 32 bytes');
};

const encrypt = (plainText) => {
  if (plainText === null || plainText === undefined || plainText === '') return null;

  const key = getEncryptionKey();
  if (!key) {
    throw new Error('KYC_ENCRYPTION_KEY is required to store sensitive KYC data');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
};

module.exports = {
  encrypt,
};
