const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const { maskAadhaar } = require('../utils/security');

const client = axios.create({
  baseURL: env.DECENTRO_BASE_URL,
  timeout: 15000,
});

const getKycModuleSecret = () =>
  env.DECENTRO_KYC_AND_ONBOARDING_MODULE_SECRET || env.DECENTRO_MODULE_SECRET;

const getKycProviderSecret = () =>
  env.DECENTRO_ZOOPONE_PROVIDER_SECRET || env.DECENTRO_PROVIDER_SECRET;

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (env.DECENTRO_API_TOKEN) {
    headers.Authorization = `Bearer ${env.DECENTRO_API_TOKEN}`;
  } else {
    headers.client_id = env.DECENTRO_CLIENT_ID;
    headers.client_secret = env.DECENTRO_CLIENT_SECRET;
  }

  const moduleSecret = getKycModuleSecret();
  if (moduleSecret) {
    headers.module_secret = moduleSecret;
  }

  const providerSecret = getKycProviderSecret();
  if (providerSecret) {
    headers.provider_secret = providerSecret;
  }

  return headers;
};

const hasCredentials = () =>
  Boolean(
    (env.DECENTRO_API_TOKEN || (env.DECENTRO_CLIENT_ID && env.DECENTRO_CLIENT_SECRET))
    && getKycModuleSecret()
  );

const getConsentPurpose = () => env.DECENTRO_CONSENT_PURPOSE;

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
  response_key: 'success_pan',
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
    consent: 'Y',
    consent_purpose: getConsentPurpose(),
    name,
  };

  const response = await withRetry(() =>
    client.post('/kyc/public_registry/validate', payload, { headers: getHeaders() })
  );

  const data = response.data || {};
  const kycResult = data.kycResult || data.data || {};
  return {
    reference_id: data.decentroTxnId || data.reference_id || referenceId,
    status: data.kycStatus || data.status || data.responseKey || 'PENDING',
    pan_status: kycResult.idStatus || data.pan_status || data.status,
    name: kycResult.name || data.full_name || data.name,
    raw: data,
  };
};

const createDigilockerSession = async ({ redirectUrl, state }) => {
  const referenceId = `digio_${uuidv4().replace(/-/g, '').slice(0, 18)}`;
  const callbackUrl = new URL(env.DECENTRO_REDIRECT_URL || redirectUrl || 'http://localhost:3000/kyc');
  callbackUrl.searchParams.set('state', state);

  if (env.KYC_MOCK_MODE || !hasCredentials()) {
    callbackUrl.searchParams.set('status', 'success');
    callbackUrl.searchParams.set('code', `mock-code-${referenceId}`);
    callbackUrl.searchParams.set('reference_id', referenceId);
    callbackUrl.searchParams.set('initial_decentro_transaction_id', referenceId);
    return {
      reference_id: referenceId,
      authorization_url: callbackUrl.toString(),
      initial_decentro_transaction_id: referenceId,
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
      raw: { mock: true },
    };
  }

  const payload = {
    reference_id: referenceId,
    redirect_url: callbackUrl.toString(),
    consent: true,
    consent_purpose: getConsentPurpose(),
    abstract_access_token: false,
    documents_for_consent: ['ADHAR', 'PAN'],
  };

  const response = await withRetry(() =>
    client.post('/v2/kyc/digilocker/initiate_session', payload, { headers: getHeaders() })
  );

  const data = response.data || {};
  const inner = data.data || {};
  return {
    reference_id: referenceId,
    authorization_url: inner.authorizationUrl || data.authorization_url || data.url || data.redirect_url,
    initial_decentro_transaction_id: data.decentroTxnId || inner.decentroTxnId || referenceId,
    expires_at: data.expires_at ? new Date(data.expires_at) : new Date(Date.now() + 15 * 60 * 1000),
    raw: data,
  };
};

const exchangeDigilockerCode = async ({ initialDecentroTxnId, digilockerCode, referenceId }) => {
  if (env.KYC_MOCK_MODE || !hasCredentials()) {
    return {
      access_token: `mock-access-token-${referenceId}`,
      expires_at: new Date(Date.now() + 55 * 60 * 1000),
      raw: { mock: true, status: 'SUCCESS' },
    };
  }

  const payload = {
    reference_id: referenceId,
    consent: true,
    consent_purpose: getConsentPurpose(),
    initial_decentro_transaction_id: initialDecentroTxnId,
    digilocker_code: digilockerCode,
  };

  const response = await withRetry(() =>
    client.post('/v2/kyc/digilocker/access_token/code', payload, { headers: getHeaders() })
  );

  const data = response.data || {};
  const inner = data.data || {};
  return {
    access_token: inner.accessToken || inner.access_token,
    expires_at: inner.expiresAt || inner.expires_at
      ? new Date(inner.expiresAt || inner.expires_at)
      : new Date(Date.now() + 55 * 60 * 1000),
    raw: data,
  };
};

const getDigilockerIssuedFiles = async ({ initialDecentroTxnId, referenceId }) => {
  if (env.KYC_MOCK_MODE || !hasCredentials()) {
    return {
      documents: [
        { doctype: 'ADHAR', description: 'Aadhaar Card', uri: 'mock-aadhaar-uri' },
        { doctype: 'PAN', description: 'PAN Card', uri: 'mock-pan-uri' },
      ],
      raw: { mock: true, status: 'SUCCESS' },
    };
  }

  const response = await withRetry(() =>
    client.post('/v2/kyc/digilocker/issued_files', {
      initial_decentro_transaction_id: initialDecentroTxnId,
      consent: true,
      consent_purpose: getConsentPurpose(),
      reference_id: referenceId,
    }, { headers: getHeaders() })
  );

  const data = response.data || {};
  return {
    documents: data.data || [],
    raw: data,
  };
};

const getDigilockerFileData = async ({ initialDecentroTxnId, referenceId, fileUrn }) => {
  if (env.KYC_MOCK_MODE || !hasCredentials()) {
    return {
      raw: {
        status: 'SUCCESS',
        data: {
          idNumber: 'ABCDE1234F',
          name: 'Sandbox Investor',
        },
      },
    };
  }

  const response = await withRetry(() =>
    client.post('/v2/kyc/digilocker/file/data', {
      initial_decentro_transaction_id: initialDecentroTxnId,
      file_urn: fileUrn,
      consent: true,
      consent_purpose: getConsentPurpose(),
      reference_id: referenceId,
    }, { headers: getHeaders() })
  );

  return {
    raw: response.data || {},
  };
};

const normalizeDigilockerResult = ({ session, issuedFiles, fileData, callbackPayload = {} }) => {
  const documents = issuedFiles?.documents || [];
  const panDoc = documents.find((doc) => String(doc.doctype || '').toUpperCase() === 'PAN');
  const aadhaarDoc = documents.find((doc) => ['ADHAR', 'EAADHAAR'].includes(String(doc.doctype || '').toUpperCase()));
  const data = fileData?.raw?.data || fileData?.raw?.kycResult || {};
  const status = String(fileData?.raw?.status || session?.raw?.status || callbackPayload.status || '').toUpperCase();
  const verified = ['SUCCESS', 'VERIFIED', 'COMPLETED', 'AUTHENTICATED'].includes(status) || Boolean(panDoc || aadhaarDoc);

  return {
    verified,
    status: verified ? 'VERIFIED' : status === 'REJECTED' ? 'REJECTED' : 'PENDING',
    reference_id: callbackPayload.reference_id || session?.reference_id || session?.initial_decentro_transaction_id,
    aadhaar_masked: callbackPayload.aadhaar_masked || maskAadhaar(data.aadhaar_number),
    name: data.name || data.full_name || callbackPayload.name,
    pan_number: data.idNumber || data.pan || null,
    documents: documents.map((doc) => ({
      doctype: doc.doctype || null,
      description: doc.description || doc.name || null,
      issuer: doc.issuer || null,
      uri: doc.uri || null,
    })),
    profile: {
      name: data.name || data.full_name || callbackPayload.name || null,
      aadhaar_masked: callbackPayload.aadhaar_masked || null,
    },
    raw: {
      session: session?.raw,
      issuedFiles: issuedFiles?.raw,
      fileData: fileData?.raw,
      callbackPayload,
    },
  };
};

const verifyWebhookSignature = ({ payload, signature }) => {
  if (!env.DECENTRO_WEBHOOK_SECRET) return false;

  const expectedSignature = crypto
    .createHmac('sha256', env.DECENTRO_WEBHOOK_SECRET)
    .update(payload)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(String(signature || ''))
  );
};

module.exports = {
  createDigilockerSession,
  exchangeDigilockerCode,
  getDigilockerFileData,
  getDigilockerIssuedFiles,
  hasCredentials,
  normalizeDigilockerResult,
  verifyPan,
  verifyWebhookSignature,
};
