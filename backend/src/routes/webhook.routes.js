const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kyc.controller');
const { asyncHandler } = require('../middlewares/error.middleware');

router.post('/decentro', asyncHandler(kycController.handleDecentroWebhook));

module.exports = router;
