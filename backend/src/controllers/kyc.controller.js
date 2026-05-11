const { User, KycLog, VerificationSession } = require('../models');
const decentro = require('../services/decentro.service');
const logger = require('../utils/logger');
const { sendError, sendSuccess } = require('../utils/response');
const { maskPan, sanitizeForLog } = require('../utils/security');

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const requestContext = (req) => ({
  ip_address: req.ip || req.headers['x-forwarded-for'] || null,
  user_agent: req.headers['user-agent'] || null,
});

const writeKycLog = (req, values) =>
  KycLog.create({
    user_id: req.user.user_id,
    ...requestContext(req),
    ...values,
  }).catch((error) => logger.error('KYC log write failed:', error.message));

const getStatus = async (req, res) => {
  const user = await User.findOne({ user_id: req.user.user_id });
  const sessions = await VerificationSession.find({ user_id: req.user.user_id })
    .sort({ created_at: -1 })
    .limit(5);
  const logs = await KycLog.find({ user_id: req.user.user_id })
    .sort({ created_at: -1 })
    .limit(10);

  return sendSuccess(res, {
    user: user.toJSON(),
    sessions,
    logs,
  }, 'KYC status retrieved');
};

const verifyPan = async (req, res) => {
  try {
    const panNumber = String(req.body?.panNumber || '').trim().toUpperCase();
    if (!PAN_REGEX.test(panNumber)) {
      return sendError(res, 'Invalid PAN format', 400);
    }

    const user = await User.findOne({ user_id: req.user.user_id });
    if (!user) return sendError(res, 'User not found', 404);

    user.kycStatus = 'PENDING';
    user.kycMethod = 'PAN';
    user.kycSubmittedAt = new Date();
    await user.save();

    await writeKycLog(req, {
      method: 'PAN',
      status: 'INITIATED',
      message: 'PAN verification initiated',
      metadata: { pan: maskPan(panNumber) },
    });

    const result = await decentro.verifyPan({ panNumber, name: user.name });
    const isVerified = ['SUCCESS', 'VALID', 'VERIFIED'].includes(
      String(result.pan_status || result.status || '').toUpperCase()
    );

    const session = await VerificationSession.create({
      user_id: user.user_id,
      method: 'PAN',
      provider_reference_id: result.reference_id,
      status: isVerified ? 'VERIFIED' : 'REJECTED',
      request_payload: { pan: maskPan(panNumber) },
      response_payload: sanitizeForLog(result.raw),
    });

    user.isKycVerified = isVerified;
    user.kycStatus = isVerified ? 'VERIFIED' : 'REJECTED';
    user.kycMethod = 'PAN';
    user.panNumber = panNumber;
    user.verificationReferenceId = result.reference_id;
    user.kycSubmittedAt = new Date();
    user.kycVerifiedName = result.name || user.name;
    await user.save();

    await writeKycLog(req, {
      method: 'PAN',
      status: isVerified ? 'VERIFIED' : 'REJECTED',
      reference_id: result.reference_id,
      message: isVerified ? 'PAN verified' : 'PAN verification rejected',
      metadata: { session_id: session.verification_session_id, pan: maskPan(panNumber) },
    });

    return sendSuccess(res, {
      status: user.kycStatus,
      method: 'PAN',
      verified_name: user.kycVerifiedName,
      pan_status: result.pan_status || result.status,
      pan_masked: maskPan(panNumber),
      verification_reference_id: result.reference_id,
      verified_at: user.kycSubmittedAt,
    }, isVerified ? 'PAN verified' : 'PAN verification rejected', isVerified ? 200 : 422);
  } catch (error) {
    logger.error('PAN verification error:', error?.response?.data || error.message);
    await writeKycLog(req, {
      method: 'PAN',
      status: 'FAILED',
      message: 'PAN verification failed',
    });
    return sendError(res, error?.response?.data?.message || 'PAN verification failed', error?.response?.status || 500);
  }
};

const createDigilockerSession = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.user.user_id });
    if (!user) return sendError(res, 'User not found', 404);

    user.kycStatus = 'PENDING';
    user.kycMethod = 'DIGILOCKER';
    user.kycSubmittedAt = new Date();
    await user.save();

    const result = await decentro.createDigilockerSession({
      user,
      originUrl: req.body?.origin_url,
    });

    const session = await VerificationSession.create({
      user_id: user.user_id,
      method: 'DIGILOCKER',
      provider_reference_id: result.reference_id,
      status: 'PENDING',
      redirect_url: result.authorization_url,
      response_payload: sanitizeForLog(result.raw),
      expires_at: result.expires_at,
    });

    user.verificationReferenceId = result.reference_id;
    await user.save();

    await writeKycLog(req, {
      method: 'DIGILOCKER',
      status: 'INITIATED',
      reference_id: result.reference_id,
      message: 'DigiLocker session created',
      metadata: { session_id: session.verification_session_id },
    });

    return sendSuccess(res, {
      verification_session_id: session.verification_session_id,
      reference_id: result.reference_id,
      authorization_url: result.authorization_url,
      expires_at: result.expires_at,
    }, 'DigiLocker session created');
  } catch (error) {
    logger.error('DigiLocker initiation error:', error?.response?.data || error.message);
    return sendError(res, error?.response?.data?.message || 'Failed to create DigiLocker session', error?.response?.status || 500);
  }
};

const completeDigilockerCallback = async (req, res) => {
  try {
    const payload = { ...req.query, ...req.body };
    const result = decentro.normalizeDigilockerResult(payload);
    const referenceId = result.reference_id || req.params.referenceId;

    const session = await VerificationSession.findOneAndUpdate(
      { provider_reference_id: referenceId },
      {
        $set: {
          status: result.status,
          response_payload: sanitizeForLog(result.raw),
        },
      },
      { new: true }
    );

    if (!session) return sendError(res, 'Verification session not found', 404);

    const user = await User.findOne({ user_id: session.user_id });
    if (!user) return sendError(res, 'User not found', 404);

    user.digilockerVerified = result.verified;
    user.isKycVerified = result.verified;
    user.kycStatus = result.verified ? 'VERIFIED' : result.status;
    user.kycMethod = 'DIGILOCKER';
    user.aadhaarMasked = result.aadhaar_masked || user.aadhaarMasked;
    user.kycVerifiedName = result.name || user.kycVerifiedName || user.name;
    user.kycDob = result.dob || user.kycDob;
    user.verificationReferenceId = referenceId;
    user.kycSubmittedAt = new Date();
    await user.save();

    await KycLog.create({
      user_id: user.user_id,
      method: 'DIGILOCKER',
      status: result.verified ? 'VERIFIED' : result.status,
      reference_id: referenceId,
      ip_address: req.ip || null,
      user_agent: req.headers['user-agent'] || null,
      message: result.verified ? 'DigiLocker verified' : 'DigiLocker callback received',
      metadata: { session_id: session.verification_session_id },
    });

    return sendSuccess(res, {
      status: user.kycStatus,
      aadhaar_masked: user.aadhaarMasked,
      verified_name: user.kycVerifiedName,
      reference_id: referenceId,
    }, 'DigiLocker callback processed');
  } catch (error) {
    logger.error('DigiLocker callback error:', error.message);
    return sendError(res, 'Failed to process DigiLocker callback', 500);
  }
};

const listAdminKyc = async (req, res) => {
  const status = req.query.status ? String(req.query.status).toUpperCase() : null;
  const query = status ? { kycStatus: status } : {};
  const users = await User.find(query)
    .sort({ updated_at: -1 })
    .limit(100);
  const logs = await KycLog.find({})
    .sort({ created_at: -1 })
    .limit(100);

  return sendSuccess(res, { users: users.map((user) => user.toJSON()), logs }, 'Admin KYC data retrieved');
};

module.exports = {
  completeDigilockerCallback,
  createDigilockerSession,
  getStatus,
  listAdminKyc,
  verifyPan,
};
