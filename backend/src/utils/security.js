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
  const redact = (value) => {
    if (Array.isArray(value)) {
      return value.map(redact);
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => {
          if ([
            'pan',
            'panNumber',
            'id_number',
            'aadhaar',
            'aadhaarNumber',
            'aadhaar_number',
            'client_secret',
            'module_secret',
            'provider_secret',
            'access_token',
            'refresh_token',
            'digilocker_code',
            'code',
            'authorization',
          ].includes(key)) {
            return [key, '***MASKED***'];
          }

          return [key, redact(nestedValue)];
        })
      );
    }

    return value;
  };

  return redact(clone);
};

module.exports = {
  generateOtp,
  hashValue,
  maskAadhaar,
  maskPan,
  sanitizeForLog,
};
