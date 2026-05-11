const crypto = require('crypto');

const hashValue = (value) =>
  crypto.createHash('sha256').update(String(value || '')).digest('hex');

const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const maskPan = (pan) => {
  const normalized = String(pan || '').toUpperCase();
  if (normalized.length < 5) return '';
  return `${normalized.slice(0, 3)}***${normalized.slice(-1)}`;
};

const maskAadhaar = (aadhaar) => {
  const digits = String(aadhaar || '').replace(/\D/g, '');
  if (digits.length < 4) return 'XXXX-XXXX-XXXX';
  return `XXXX-XXXX-${digits.slice(-4)}`;
};

const sanitizeForLog = (payload = {}) => {
  const clone = JSON.parse(JSON.stringify(payload || {}));
  ['pan', 'panNumber', 'aadhaar', 'aadhaarNumber', 'client_secret'].forEach((key) => {
    if (clone[key]) clone[key] = '***MASKED***';
  });
  return clone;
};

module.exports = {
  generateOtp,
  hashValue,
  maskAadhaar,
  maskPan,
  sanitizeForLog,
};
