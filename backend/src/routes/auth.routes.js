/**
 * Authentication Routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

// Public routes
router.post('/session', asyncHandler(authController.createSession));
router.post('/signup', asyncHandler(authController.signupWithEmail));
router.post('/login', asyncHandler(authController.loginWithEmail));
router.post('/google', asyncHandler(authController.loginWithGoogle));

// Protected routes
router.get('/me', requireAuth, asyncHandler(authController.getCurrentUser));
router.post('/logout', requireAuth, asyncHandler(authController.logout));

module.exports = router;
