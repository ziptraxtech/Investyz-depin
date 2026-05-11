const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const { maskAadhaar } = require('../utils/security');

const client = axios.create({
  baseURL: env.DECENTRO_BASE_URL,
  timeout: 15000,
});

const getHeaders = () => ({
  'Content-Type': 'application/json',
  client_id: env.DECENTRO_CLIENT_ID,
  client_secret: env.DECENTRO_CLIENT_SECRET,
  module_secret: env.DECENTRO_MODULE_SECRET,
  provider_secret: env.DECENTRO_PROVIDER_SECRET,
});

const hasCredentials = () =>
  Boolean(env.DECENTRO_CLIENT_ID && env.DECENTRO_CLIENT_SECRET && env.DECENTRO_MODULE_SECRET);

const withRetry = async (requestFactory, attempts = 2) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await requestFactory();
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status && status < 500) break;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 400));
      }
    }
  }
  throw lastError;
};

const mockPanVerification = (panNumber, referenceId) => ({
  reference_id: referenceId,
  status: 'SUCCESS',
  pan_status: 'VALID',
  name: 'Sandbox Investor',
  response_key: 'success',
  raw: { mock: true, pan: `${panNumber.slice(0, 3)}***${panNumber.slice(-1)}` },
});

const verifyPan = async ({ panNumber, name }) => {
  const referenceId = `pan_${uuidv4().replace(/-/g, '').slice(0, 18)}`;

  if (env.KYC_MOCK_MODE || !hasCredentials()) {
    return mockPanVerification(panNumber, referenceId);
  }

  const payload = {
    reference_id: referenceId,
    document_type: 'PAN',
    id_number: panNumber,
    consent: true,
    consent_purpose: 'KYC verification for EV infrastructure investment onboarding',
    name,
  };

  const response = await withRetry(() =>
    client.post('/v2/kyc/identities/verify', payload, { headers: getHeaders() })
  );

  const data = response.data || {};
  return {
    reference_id: data.decentroTxnId || data.reference_id || referenceId,
    status: data.status || data.response_key || 'PENDING',
    pan_status: data.data?.status || data.pan_status || data.status,
    name: data.data?.full_name || data.full_name || data.name,
    raw: data,
  };
};

const createDigilockerSession = async ({ user, originUrl }) => {
  const referenceId = `digio_${uuidv4().replace(/-/g, '').slice(0, 18)}`;
  const redirectBase = env.DECENTRO_REDIRECT_URL || originUrl;
  const callbackUrl = new URL('/kyc', redirectBase || 'http://localhost:3000');
  callbackUrl.searchParams.set('reference_id', referenceId);

  if (env.KYC_MOCK_MODE || !hasCredentials()) {
    callbackUrl.searchParams.set('status', 'success');
    return {
      reference_id: referenceId,
      authorization_url: callbackUrl.toString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
      raw: { mock: true },
    };
  }

  const payload = {
    reference_id: referenceId,
    redirect_uri: callbackUrl.toString(),
    consent: true,
    consent_purpose: 'DigiLocker KYC for EV infrastructure investment onboarding',
    customer: {
      name: user.name,
      email: user.email,
      mobile: user.phone,
    },
  };

  const response = await withRetry(() =>
    client.post('/v2/kyc/digilocker/session', payload, { headers: getHeaders() })
  );

  const data = response.data || {};
  return {
    reference_id: data.reference_id || data.decentroTxnId || referenceId,
    authorization_url: data.authorization_url || data.url || data.redirect_url,
    expires_at: data.expires_at ? new Date(data.expires_at) : new Date(Date.now() + 15 * 60 * 1000),
    raw: data,
  };
};

const normalizeDigilockerResult = (payload = {}) => {
  const data = payload.data || payload;
  const status = String(data.status || data.response_key || '').toUpperCase();
  const verified = ['SUCCESS', 'VERIFIED', 'COMPLETED', 'AUTHENTICATED'].includes(status);
  return {
    verified,
    status: verified ? 'VERIFIED' : status === 'REJECTED' ? 'REJECTED' : 'PENDING',
    reference_id: data.reference_id || data.decentroTxnId || payload.reference_id,
    aadhaar_masked: data.aadhaar_masked || data.masked_aadhaar || maskAadhaar(data.aadhaar_number),
    name: data.name || data.full_name,
    dob: data.dob || data.date_of_birth,
    raw: payload,
  };
};

module.exports = {
  createDigilockerSession,
  hasCredentials,
  normalizeDigilockerResult,
  verifyPan,
};
