const crypto = require('crypto');
const { User, VerificationSession } = require('../models');
const env = require('../config/env');
const { hasDatabaseUrl } = require('../config/postgres');
const decentro = require('../services/decentro.service');
const logger = require('../utils/logger');
const { sendError, sendSuccess } = require('../utils/response');
const { maskPan, sanitizeForLog } = require('../utils/security');
const {
  getKycByReference,
  getKycByState,
  getUserWithKyc,
  insertVerificationLog,
  listAdminKycRecords,
  listRecentVerificationLogs,
  listVerificationLogs,
  syncUser,
  upsertDigilockerSession,
  upsertPanVerification,
} = require('../repositories/kyc.repository');

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const SUCCESS_STATUSES = new Set(['SUCCESS', 'VALID', 'VERIFIED', 'COMPLETED', 'AUTHENTICATED']);
const FAILURE_STATUSES = new Set(['FAILED', 'FAILURE', 'REJECTED', 'DENIED', 'ERROR', 'EXPIRED']);
const shouldUseMongoKycFlow = () => env.KYC_MOCK_MODE || !hasDatabaseUrl() || !decentro.hasCredentials();

const requestContext = (req) => ({
  ip_address: req.ip || req.headers['x-forwarded-for'] || null,
  user_agent: req.headers['user-agent'] || null,
});

const normalizeMongoUser = (user) => user?.toJSON ? user.toJSON() : user;

const mapMongoVerificationSession = (session) => {
  if (!session) return null;

  const responsePayload = session.response_payload || {};
  const requestPayload = session.request_payload || {};
  const verified = session.status === 'VERIFIED';
  const rejected = ['REJECTED', 'FAILED', 'EXPIRED'].includes(session.status);

  return {
    id: session.verification_session_id,
    user_id: session.user_id,
    pan_verified: false,
    pan_name: null,
    pan_masked: null,
    pan_last4: null,
    pan_reference_id: null,
    digilocker_verified: verified,
    digilocker_reference_id: session.provider_reference_id,
    digilocker_state: requestPayload.state || null,
    digilocker_status: session.status,
    digilocker_init_txn_id:
      responsePayload.initial_decentro_transaction_id ||
      requestPayload.initial_decentro_transaction_id ||
      null,
    digilocker_documents: responsePayload.documents || [],
    digilocker_profile: responsePayload.profile || {},
    kyc_status: verified ? 'VERIFIED' : rejected ? 'REJECTED' : 'PENDING',
    created_at: session.created_at,
    updated_at: session.updated_at,
    last_verified_at: verified ? session.updated_at : null,
  };
};

const findMongoVerificationSession = async (payload) => {
  if (payload.state) {
    const byState = await VerificationSession.findOne({
      method: 'DIGILOCKER',
      'request_payload.state': payload.state,
    }).sort({ updated_at: -1 });
    if (byState) return byState;
  }

  const referencesToTry = [
    payload.reference_id,
    payload.initial_decentro_transaction_id,
    payload.decentro_transaction_id,
    payload.decentroTxnId,
  ].filter(Boolean);

  for (const reference of referencesToTry) {
    const session = await VerificationSession.findOne({
      method: 'DIGILOCKER',
      $or: [
        { provider_reference_id: reference },
        { 'response_payload.initial_decentro_transaction_id': reference },
        { 'request_payload.initial_decentro_transaction_id': reference },
      ],
    }).sort({ updated_at: -1 });

    if (session) return session;
  }

  return null;
};

const buildKycStatus = ({ panVerified, digilockerVerified, digilockerStatus }) => {
  if (panVerified || digilockerVerified) return 'VERIFIED';
  if (FAILURE_STATUSES.has(String(digilockerStatus || '').toUpperCase())) return 'REJECTED';
  if (digilockerStatus || panVerified === false) return 'PENDING';
  return 'NOT_STARTED';
};

const mergeUserWithKyc = (user, kyc) => ({
  ...user,
  kycStatus: kyc?.kyc_status || user?.kycStatus || 'NOT_STARTED',
  isKycVerified: Boolean(kyc?.pan_verified || kyc?.digilocker_verified || user?.isKycVerified),
  kycMethod: kyc?.digilocker_verified ? 'DIGILOCKER' : kyc?.pan_verified ? 'PAN' : user?.kycMethod || null,
  panNumberMasked: kyc?.pan_masked || user?.panNumberMasked || null,
  digilockerVerified: Boolean(kyc?.digilocker_verified || user?.digilockerVerified),
  verificationReferenceId: kyc?.digilocker_reference_id || kyc?.pan_reference_id || user?.verificationReferenceId || null,
  kycVerifiedName: kyc?.pan_name || kyc?.digilocker_profile?.name || user?.kycVerifiedName || null,
  aadhaarMasked: kyc?.digilocker_profile?.aadhaar_masked || user?.aadhaarMasked || null,
});

const syncInvestorProfile = async (mongoUser) => syncUser({
  externalUserId: mongoUser.user_id,
  fullName: mongoUser.name,
  email: mongoUser.email,
  phone: mongoUser.phone,
});

const writeVerificationLog = async ({
  req,
  userId = null,
  apiType,
  requestId = null,
  responseStatus = null,
  httpStatus = null,
  direction = 'outbound',
  eventType = null,
  callbackTransactionId = null,
  metadata = {},
}) => insertVerificationLog({
  userId,
  provider: 'DECENTRO',
  apiType,
  requestId,
  responseStatus,
  httpStatus,
  direction,
  eventType,
  callbackTransactionId,
  metadata: {
    ...requestContext(req),
    ...sanitizeForLog(metadata),
  },
});

const persistMongoKycSummary = async (mongoUser, kycRecord) => {
  mongoUser.isKycVerified = Boolean(kycRecord?.pan_verified || kycRecord?.digilocker_verified);
  mongoUser.kycStatus = kycRecord?.kyc_status || 'NOT_STARTED';
  mongoUser.kycMethod = kycRecord?.digilocker_verified ? 'DIGILOCKER' : kycRecord?.pan_verified ? 'PAN' : null;
  mongoUser.panNumber = kycRecord?.pan_masked ? null : mongoUser.panNumber;
  mongoUser.digilockerVerified = Boolean(kycRecord?.digilocker_verified);
  mongoUser.aadhaarMasked = kycRecord?.digilocker_profile?.aadhaar_masked || mongoUser.aadhaarMasked || null;
  mongoUser.kycVerifiedName = kycRecord?.pan_name || kycRecord?.digilocker_profile?.name || mongoUser.kycVerifiedName || null;
  mongoUser.verificationReferenceId =
    kycRecord?.digilocker_reference_id ||
    kycRecord?.pan_reference_id ||
    mongoUser.verificationReferenceId ||
    null;
  mongoUser.kycSubmittedAt = new Date();
  await mongoUser.save();
};

const resolveDigilockerLookup = async (payload) => {
  if (payload.state) {
    const byState = await getKycByState(payload.state);
    if (byState) return byState;
  }

  const referencesToTry = [
    payload.reference_id,
    payload.initial_decentro_transaction_id,
    payload.decentro_transaction_id,
    payload.decentroTxnId,
  ].filter(Boolean);

  for (const reference of referencesToTry) {
    const record = await getKycByReference(reference);
    if (record) return record;
  }

  return null;
};

const getStatus = async (req, res) => {
  const mongoUser = await User.findOne({ user_id: req.user.user_id });
  if (!mongoUser) return sendError(res, 'User not found', 404);

  if (shouldUseMongoKycFlow()) {
    const session = await VerificationSession.findOne({
      user_id: mongoUser.user_id,
      method: 'DIGILOCKER',
    }).sort({ updated_at: -1 });

    return sendSuccess(res, {
      user: mergeUserWithKyc(normalizeMongoUser(mongoUser), mapMongoVerificationSession(session)),
      kyc: mapMongoVerificationSession(session),
      logs: [],
    }, 'KYC status retrieved');
  }

  const syncedUser = await syncInvestorProfile(mongoUser);
  const profile = await getUserWithKyc(mongoUser.user_id);
  const logs = await listVerificationLogs(syncedUser.id, 10);

  return sendSuccess(res, {
    user: mergeUserWithKyc(normalizeMongoUser(mongoUser), profile?.kyc),
    kyc: profile?.kyc || null,
    logs,
  }, 'KYC status retrieved');
};

const verifyPan = async (req, res) => {
  const panNumber = String(req.body?.panNumber || '').trim().toUpperCase();
  if (!PAN_REGEX.test(panNumber)) {
    return sendError(res, 'Invalid PAN format', 400);
  }

  const mongoUser = await User.findOne({ user_id: req.user.user_id });
  if (!mongoUser) return sendError(res, 'User not found', 404);

  const syncedUser = await syncInvestorProfile(mongoUser);
  await writeVerificationLog({
    req,
    userId: syncedUser.id,
    apiType: 'PAN_VERIFY',
    requestId: `pan:${req.user.user_id}:${panNumber}`,
    responseStatus: 'INITIATED',
    metadata: {
      message: 'PAN verification initiated',
      pan_masked: maskPan(panNumber),
    },
  });

  try {
    const result = await decentro.verifyPan({ panNumber, name: mongoUser.name });
    const normalizedPanStatus = String(result.pan_status || result.status || '').toUpperCase();
    const verified = SUCCESS_STATUSES.has(normalizedPanStatus);
    const kycRecord = await upsertPanVerification({
      userId: syncedUser.id,
      panNumber,
      panMasked: maskPan(panNumber),
      panName: result.name || mongoUser.name,
      panReferenceId: result.reference_id,
      verified,
      status: verified ? 'VERIFIED' : 'REJECTED',
    });

    await persistMongoKycSummary(mongoUser, kycRecord);
    await writeVerificationLog({
      req,
      userId: syncedUser.id,
      apiType: 'PAN_VERIFY',
      requestId: result.reference_id,
      responseStatus: verified ? 'VERIFIED' : normalizedPanStatus || 'REJECTED',
      metadata: {
        message: verified ? 'PAN verified successfully' : 'PAN verification rejected',
        pan_masked: kycRecord.pan_masked,
      },
    });

    return sendSuccess(res, {
      status: kycRecord.kyc_status,
      method: 'PAN',
      pan_masked: kycRecord.pan_masked,
      pan_status: normalizedPanStatus || 'UNKNOWN',
      verified_name: kycRecord.pan_name,
      verification_reference_id: kycRecord.pan_reference_id,
      verified_at: kycRecord.last_verified_at,
    }, verified ? 'PAN verified' : 'PAN verification rejected', verified ? 200 : 422);
  } catch (error) {
    const statusCode = error.statusCode || error?.response?.status || 500;
    logger.error('PAN verification error:', error?.response?.data || error.message);
    await writeVerificationLog({
      req,
      userId: syncedUser.id,
      apiType: 'PAN_VERIFY',
      requestId: `pan:${req.user.user_id}`,
      responseStatus: 'FAILED',
      httpStatus: statusCode,
      metadata: {
        message: 'PAN verification failed',
        reason: error?.response?.data?.message || error.message,
      },
    });
    return sendError(res, error?.response?.data?.message || error.message || 'PAN verification failed', statusCode);
  }
};

const createDigilockerSession = async (req, res) => {
  const mongoUser = await User.findOne({ user_id: req.user.user_id });
  if (!mongoUser) return sendError(res, 'User not found', 404);

  const state = crypto.randomBytes(24).toString('hex');
  const originUrl = String(req.body?.origin_url || '').trim();
  const redirectUrl = originUrl ? `${originUrl.replace(/\/$/, '')}/kyc` : undefined;

  let syncedUser = null;

  try {
    const result = await decentro.createDigilockerSession({ redirectUrl, state });

    if (shouldUseMongoKycFlow()) {
      await VerificationSession.findOneAndUpdate(
        {
          user_id: mongoUser.user_id,
          method: 'DIGILOCKER',
          provider_reference_id: result.reference_id,
        },
        {
          status: 'PENDING',
          provider: 'DECENTRO',
          redirect_url: redirectUrl || null,
          request_payload: {
            state,
            origin_url: originUrl || null,
            initial_decentro_transaction_id: result.initial_decentro_transaction_id,
          },
          response_payload: {
            authorization_url: result.authorization_url,
            initial_decentro_transaction_id: result.initial_decentro_transaction_id,
          },
          expires_at: result.expires_at || null,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      mongoUser.kycStatus = 'PENDING';
      mongoUser.kycMethod = 'DIGILOCKER';
      mongoUser.verificationReferenceId = result.reference_id;
      mongoUser.kycSubmittedAt = new Date();
      await mongoUser.save();

      return sendSuccess(res, {
        status: 'PENDING',
        reference_id: result.reference_id,
        state,
        authorization_url: result.authorization_url,
        expires_at: result.expires_at,
        initial_decentro_transaction_id: result.initial_decentro_transaction_id,
      }, 'DigiLocker session created');
    }

    syncedUser = await syncInvestorProfile(mongoUser);
    const kycRecord = await upsertDigilockerSession({
      userId: syncedUser.id,
      digilockerReferenceId: result.reference_id,
      digilockerState: state,
      digilockerStatus: 'PENDING',
      digilockerInitTxnId: result.initial_decentro_transaction_id,
      verified: false,
      kycStatus: 'PENDING',
    });

    mongoUser.kycStatus = 'PENDING';
    mongoUser.kycMethod = 'DIGILOCKER';
    mongoUser.verificationReferenceId = result.reference_id;
    mongoUser.kycSubmittedAt = new Date();
    await mongoUser.save();

    await writeVerificationLog({
      req,
      userId: syncedUser.id,
      apiType: 'DIGILOCKER_INITIATE',
      requestId: result.reference_id,
      responseStatus: 'PENDING',
      metadata: {
        message: 'DigiLocker session created',
        state,
        authorization_url: result.authorization_url,
      },
    });

    return sendSuccess(res, {
      status: kycRecord.kyc_status,
      reference_id: result.reference_id,
      state,
      authorization_url: result.authorization_url,
      expires_at: result.expires_at,
      initial_decentro_transaction_id: result.initial_decentro_transaction_id,
    }, 'DigiLocker session created');
  } catch (error) {
    logger.error('DigiLocker initiation error:', error?.response?.data || error.message);
    if (syncedUser?.id) {
      await writeVerificationLog({
        req,
        userId: syncedUser.id,
        apiType: 'DIGILOCKER_INITIATE',
        responseStatus: 'FAILED',
        httpStatus: error?.response?.status || 500,
        metadata: {
          message: 'Failed to create DigiLocker session',
          reason: error?.response?.data?.message || error.message,
        },
      });
    }
    return sendError(res, error?.response?.data?.message || 'Failed to create DigiLocker session', error?.response?.status || 500);
  }
};

const completeDigilockerCallback = async (req, res) => {
  const payload = { ...req.query, ...req.body };

  if (shouldUseMongoKycFlow()) {
    const session = await findMongoVerificationSession(payload);
    if (!session) {
      return sendError(res, 'Verification session not found', 404);
    }

    const mongoUser = await User.findOne({ user_id: session.user_id });
    if (!mongoUser) return sendError(res, 'User not found', 404);

    const incomingStatus = String(payload.status || payload.verification_status || '').toUpperCase();

    if (FAILURE_STATUSES.has(incomingStatus) || payload.error) {
      session.status = 'REJECTED';
      session.response_payload = {
        ...(session.response_payload || {}),
        callback_payload: payload,
      };
      await session.save();

      mongoUser.isKycVerified = false;
      mongoUser.kycStatus = 'REJECTED';
      mongoUser.kycMethod = 'DIGILOCKER';
      await mongoUser.save();

      return sendError(res, payload.error_description || payload.error || 'DigiLocker verification failed', 422, {
        status: 'REJECTED',
        reference_id: session.provider_reference_id,
      });
    }

    const code = payload.code || payload.digilocker_code;
    if (!code && session.status !== 'VERIFIED') {
      return sendError(res, 'Authorization code missing from DigiLocker callback', 400);
    }

    try {
      let normalizedResult;
      const initialTxnId =
        session.response_payload?.initial_decentro_transaction_id ||
        session.request_payload?.initial_decentro_transaction_id ||
        session.provider_reference_id;

      if (session.status === 'VERIFIED' && !code) {
        normalizedResult = {
          verified: true,
          status: 'VERIFIED',
          reference_id: session.provider_reference_id,
          documents: session.response_payload?.documents || [],
          profile: session.response_payload?.profile || {},
        };
      } else {
        const tokenResult = await decentro.exchangeDigilockerCode({
          initialDecentroTxnId: initialTxnId,
          digilockerCode: code,
          referenceId: session.provider_reference_id,
        });

        const issuedFiles = await decentro.getDigilockerIssuedFiles({
          initialDecentroTxnId: initialTxnId,
          referenceId: session.provider_reference_id,
        });

        const panDocument = (issuedFiles.documents || []).find((document) =>
          String(document.doctype || '').toUpperCase().includes('PAN')
        );

        const fileData = panDocument
          ? await decentro.getDigilockerFileData({
            initialDecentroTxnId: initialTxnId,
            referenceId: session.provider_reference_id,
            fileUrn: panDocument.uri || panDocument.urn,
          })
          : null;

        normalizedResult = decentro.normalizeDigilockerResult({
          session: {
            reference_id: session.provider_reference_id,
            initial_decentro_transaction_id: initialTxnId,
            raw: tokenResult.raw,
          },
          issuedFiles,
          fileData,
          callbackPayload: payload,
        });
      }

      session.status = normalizedResult.verified ? 'VERIFIED' : normalizedResult.status === 'REJECTED' ? 'REJECTED' : 'PENDING';
      session.response_payload = {
        ...(session.response_payload || {}),
        initial_decentro_transaction_id: initialTxnId,
        documents: normalizedResult.documents || [],
        profile: normalizedResult.profile || {},
        callback_payload: payload,
      };
      await session.save();

      mongoUser.isKycVerified = Boolean(normalizedResult.verified);
      mongoUser.kycStatus = normalizedResult.verified ? 'VERIFIED' : 'PENDING';
      mongoUser.kycMethod = 'DIGILOCKER';
      mongoUser.digilockerVerified = Boolean(normalizedResult.verified);
      mongoUser.aadhaarMasked = normalizedResult.profile?.aadhaar_masked || mongoUser.aadhaarMasked || null;
      mongoUser.kycVerifiedName = normalizedResult.profile?.name || normalizedResult.name || mongoUser.kycVerifiedName || null;
      mongoUser.verificationReferenceId = session.provider_reference_id;
      mongoUser.kycSubmittedAt = new Date();
      await mongoUser.save();

      return sendSuccess(res, {
        status: mongoUser.kycStatus,
        reference_id: session.provider_reference_id,
        digilocker_status: session.status,
        digilocker_verified: mongoUser.digilockerVerified,
        verified_name: mongoUser.kycVerifiedName || null,
        aadhaar_masked: mongoUser.aadhaarMasked || null,
        documents: (normalizedResult.documents || []).map((document) => ({
          doctype: document.doctype,
          description: document.description,
          issuer: document.issuer,
        })),
      }, normalizedResult.verified ? 'DigiLocker verification completed' : 'DigiLocker callback processed');
    } catch (error) {
      logger.error('DigiLocker callback error:', error?.response?.data || error.message);
      return sendError(res, error?.response?.data?.message || 'Failed to process DigiLocker callback', error?.response?.status || 500);
    }
  }

  const lookup = await resolveDigilockerLookup(payload);
  if (!lookup) {
    return sendError(res, 'Verification session not found', 404);
  }

  const mongoUser = await User.findOne({ user_id: lookup.external_user_id });
  if (!mongoUser) return sendError(res, 'User not found', 404);

  const syncedUser = await syncInvestorProfile(mongoUser);
  const incomingStatus = String(payload.status || payload.verification_status || '').toUpperCase();

  if (FAILURE_STATUSES.has(incomingStatus) || payload.error) {
    const kycRecord = await upsertDigilockerSession({
      userId: syncedUser.id,
      digilockerReferenceId: lookup.kyc.digilocker_reference_id,
      digilockerState: lookup.kyc.digilocker_state,
      digilockerStatus: incomingStatus || 'FAILED',
      digilockerInitTxnId: lookup.kyc.digilocker_init_txn_id,
      verified: false,
      kycStatus: 'REJECTED',
    });
    await persistMongoKycSummary(mongoUser, kycRecord);
    await writeVerificationLog({
      req,
      userId: syncedUser.id,
      apiType: 'DIGILOCKER_CALLBACK',
      requestId: lookup.kyc.digilocker_reference_id || lookup.kyc.digilocker_init_txn_id,
      responseStatus: incomingStatus || 'FAILED',
      httpStatus: 422,
      metadata: {
        message: 'DigiLocker callback returned a failure state',
        callback_payload: payload,
      },
    });
    return sendError(res, payload.error_description || payload.error || 'DigiLocker verification failed', 422, {
      status: kycRecord.kyc_status,
      reference_id: kycRecord.digilocker_reference_id,
    });
  }

  const code = payload.code || payload.digilocker_code;
  if (!code && !lookup.kyc.digilocker_verified) {
    return sendError(res, 'Authorization code missing from DigiLocker callback', 400);
  }

  try {
    let normalizedResult;

    if (lookup.kyc.digilocker_verified && !code) {
      normalizedResult = {
        verified: true,
        status: 'VERIFIED',
        reference_id: lookup.kyc.digilocker_reference_id,
        documents: lookup.kyc.digilocker_documents || [],
        profile: lookup.kyc.digilocker_profile || {},
      };
    } else {
      const tokenResult = await decentro.exchangeDigilockerCode({
        initialDecentroTxnId: lookup.kyc.digilocker_init_txn_id,
        digilockerCode: code,
        referenceId: lookup.kyc.digilocker_reference_id,
      });

      const issuedFiles = await decentro.getDigilockerIssuedFiles({
        initialDecentroTxnId: lookup.kyc.digilocker_init_txn_id,
        referenceId: lookup.kyc.digilocker_reference_id,
      });

      const panDocument = (issuedFiles.documents || []).find((document) =>
        String(document.doctype || '').toUpperCase().includes('PAN')
      );

      const fileData = panDocument
        ? await decentro.getDigilockerFileData({
          initialDecentroTxnId: lookup.kyc.digilocker_init_txn_id,
          referenceId: lookup.kyc.digilocker_reference_id,
          fileUrn: panDocument.uri || panDocument.urn,
        })
        : null;

      normalizedResult = decentro.normalizeDigilockerResult({
        session: {
          reference_id: lookup.kyc.digilocker_reference_id,
          initial_decentro_transaction_id: lookup.kyc.digilocker_init_txn_id,
          raw: tokenResult.raw,
        },
        issuedFiles,
        fileData,
        callbackPayload: payload,
      });

      normalizedResult.access_token = tokenResult.access_token;
      normalizedResult.access_token_expires_at = tokenResult.expires_at;
    }

    const kycStatus = buildKycStatus({
      panVerified: lookup.kyc.pan_verified,
      digilockerVerified: normalizedResult.verified,
      digilockerStatus: normalizedResult.status,
    });

    const kycRecord = await upsertDigilockerSession({
      userId: syncedUser.id,
      digilockerReferenceId: lookup.kyc.digilocker_reference_id,
      digilockerState: lookup.kyc.digilocker_state,
      digilockerStatus: normalizedResult.status,
      digilockerInitTxnId: lookup.kyc.digilocker_init_txn_id,
      accessToken: normalizedResult.access_token,
      accessTokenExpiresAt: normalizedResult.access_token_expires_at,
      documents: normalizedResult.documents,
      profile: normalizedResult.profile,
      verified: normalizedResult.verified,
      kycStatus,
    });

    await persistMongoKycSummary(mongoUser, kycRecord);
    await writeVerificationLog({
      req,
      userId: syncedUser.id,
      apiType: 'DIGILOCKER_CALLBACK',
      requestId: lookup.kyc.digilocker_reference_id || lookup.kyc.digilocker_init_txn_id,
      responseStatus: normalizedResult.status,
      metadata: {
        message: normalizedResult.verified ? 'DigiLocker verification completed' : 'DigiLocker callback processed',
        callback_payload: payload,
        documents_count: normalizedResult.documents?.length || 0,
      },
    });

    return sendSuccess(res, {
      status: kycRecord.kyc_status,
      reference_id: kycRecord.digilocker_reference_id,
      digilocker_status: kycRecord.digilocker_status,
      digilocker_verified: kycRecord.digilocker_verified,
      verified_name: kycRecord.digilocker_profile?.name || mongoUser.kycVerifiedName || null,
      aadhaar_masked: kycRecord.digilocker_profile?.aadhaar_masked || mongoUser.aadhaarMasked || null,
      documents: (kycRecord.digilocker_documents || []).map((document) => ({
        doctype: document.doctype,
        description: document.description,
        issuer: document.issuer,
      })),
    }, normalizedResult.verified ? 'DigiLocker verification completed' : 'DigiLocker callback processed');
  } catch (error) {
    logger.error('DigiLocker callback error:', error?.response?.data || error.message);
    await writeVerificationLog({
      req,
      userId: syncedUser.id,
      apiType: 'DIGILOCKER_CALLBACK',
      requestId: lookup.kyc.digilocker_reference_id || lookup.kyc.digilocker_init_txn_id,
      responseStatus: 'FAILED',
      httpStatus: error?.response?.status || 500,
      metadata: {
        message: 'DigiLocker callback processing failed',
        reason: error?.response?.data?.message || error.message,
      },
    });
    return sendError(res, error?.response?.data?.message || 'Failed to process DigiLocker callback', error?.response?.status || 500);
  }
};

const handleDecentroWebhook = async (req, res) => {
  const signature = req.headers['x-signature'];
  if (!decentro.verifyWebhookSignature({ payload: req.rawBody || JSON.stringify(req.body || {}), signature })) {
    return sendError(res, 'Invalid webhook signature', 401);
  }

  const payload = req.body || {};
  const callbackTransactionId = payload.callback_transaction_id || payload.original_callback_transaction_id || null;
  const requestId =
    payload.reference_id ||
    payload.initial_decentro_transaction_id ||
    payload.decentro_transaction_id ||
    payload.decentroTxnId ||
    null;
  const responseStatus =
    payload.status ||
    payload.transaction_status ||
    payload.verification_status ||
    payload.responseKey ||
    'RECEIVED';

  const existingLog = await writeVerificationLog({
    req,
    apiType: 'WEBHOOK',
    requestId,
    responseStatus,
    direction: 'inbound',
    eventType: payload.event || payload.event_type || 'decentro.webhook',
    callbackTransactionId,
    metadata: {
      message: 'Decentro webhook received',
      payload,
    },
  });

  if (!existingLog && callbackTransactionId) {
    return sendSuccess(res, { duplicate: true }, 'Duplicate webhook ignored');
  }

  const relatedRecord = requestId ? await getKycByReference(requestId) : null;
  if (relatedRecord && payload.reference_id && String(payload.api_type || '').toUpperCase().includes('DIGILOCKER')) {
    const normalizedStatus = String(responseStatus).toUpperCase();
    const kycStatus = SUCCESS_STATUSES.has(normalizedStatus)
      ? 'VERIFIED'
      : FAILURE_STATUSES.has(normalizedStatus)
        ? 'REJECTED'
        : 'PENDING';

    await upsertDigilockerSession({
      userId: relatedRecord.kyc.user_id,
      digilockerReferenceId: relatedRecord.kyc.digilocker_reference_id,
      digilockerState: relatedRecord.kyc.digilocker_state,
      digilockerStatus: normalizedStatus,
      digilockerInitTxnId: relatedRecord.kyc.digilocker_init_txn_id,
      verified: SUCCESS_STATUSES.has(normalizedStatus),
      kycStatus,
    });
  }

  return sendSuccess(res, { accepted: true }, 'Webhook processed');
};

const listAdminKyc = async (req, res) => {
  const status = req.query.status ? String(req.query.status).toUpperCase() : null;
  const users = await listAdminKycRecords({ status: status === 'ALL' ? null : status, limit: 100 });
  const logs = await listRecentVerificationLogs(100);
  return sendSuccess(res, { users, logs }, 'Admin KYC data retrieved');
};

module.exports = {
  completeDigilockerCallback,
  createDigilockerSession,
  getStatus,
  handleDecentroWebhook,
  listAdminKyc,
  verifyPan,
};
