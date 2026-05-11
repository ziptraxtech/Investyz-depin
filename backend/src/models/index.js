/**
 * Models Index
 * Export all models from single entry point
 */
const User = require('./user.model');
const UserSession = require('./session.model');
const Investment = require('./investment.model');
const PaymentTransaction = require('./payment.model');
const KycVerification = require('./kycVerification.model');
const KycLog = require('./kycLog.model');
const VerificationSession = require('./verificationSession.model');

module.exports = {
  User,
  UserSession,
  Investment,
  PaymentTransaction,
  KycVerification,
  KycLog,
  VerificationSession,
};
