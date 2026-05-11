/**
 * KYC Routes
 */
const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kyc.controller');
const { requireAdmin, requireAuth, requireVerifiedContact } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');
const { createRateLimiter } = require('../middlewares/security.middleware');

const kycLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: 'Too many KYC attempts. Please wait before retrying.',
});

router.get('/status', requireAuth, asyncHandler(kycController.getStatus));
router.post('/pan/verify', kycLimiter, requireAuth, requireVerifiedContact, asyncHandler(kycController.verifyPan));
router.post('/digilocker/session', kycLimiter, requireAuth, requireVerifiedContact, asyncHandler(kycController.createDigilockerSession));
router.post('/digilocker/callback', asyncHandler(kycController.completeDigilockerCallback));
router.get('/digilocker/callback', asyncHandler(kycController.completeDigilockerCallback));
router.get('/admin', requireAuth, requireAdmin, asyncHandler(kycController.listAdminKyc));

module.exports = router;
