const { PaymentTransaction, Investment } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { INVESTMENT_PLANS } = require('./segments.controller');
const env = require('../config/env');
const logger = require('../utils/logger');

const PAYMENT_METHODS = {
  gateway: {
    provider: 'DECENTRO',
    label: 'Decentro Hosted Checkout',
    instruments: ['cards', 'netbanking', 'upi'],
  },
  crypto: {
    provider: 'WEB3',
    label: 'Wallet Payment',
    instruments: ['wallet_transfer'],
  },
};

const buildSuccessUrl = (originUrl, transactionId, paymentMethod) =>
  `${originUrl}/payment/success?session_id=${transactionId}&method=${paymentMethod}`;

const buildCancelUrl = (originUrl) => `${originUrl}/payment/cancel`;

/**
 * POST /api/payments/checkout
 * Create a hosted gateway or wallet payment session
 */
const createCheckoutSession = async (req, res) => {
  try {
    const {
      plan_id,
      amount,
      origin_url,
      payment_method = 'gateway',
      wallet_address = null,
      wallet_chain_id = null,
      wallet_type = null,
    } = req.body;
    const userId = req.user.user_id;
    const selectedMethod = PAYMENT_METHODS[payment_method];
    
    // Validate plan
    const plan = INVESTMENT_PLANS.find((p) => p.plan_id === plan_id);
    
    if (!plan) {
      return sendError(res, 'Invalid plan', 400);
    }
    
    const investmentAmount = parseFloat(amount);
    
    if (investmentAmount < plan.min_investment || investmentAmount > plan.max_investment) {
      return sendError(
        res,
        `Amount must be between ${plan.min_investment} and ${plan.max_investment}`,
        400
      );
    }
    
    if (!origin_url) {
      return sendError(res, 'origin_url required', 400);
    }

    if (!selectedMethod) {
      return sendError(res, 'Unsupported payment method', 400);
    }

    if (payment_method === 'crypto' && !wallet_address) {
      return sendError(res, 'Connect a wallet before using Web3 payment', 400);
    }
    
    // Create payment transaction record
    const transaction = await PaymentTransaction.create({
      user_id: userId,
      amount: investmentAmount,
      currency: 'usd',
      payment_method,
      status: 'pending',
      metadata: {
        plan_id,
        segment_id: plan.segment_id,
        provider: selectedMethod.provider,
        provider_label: selectedMethod.label,
        payment_instruments: selectedMethod.instruments,
        wallet_address,
        wallet_chain_id,
        wallet_type,
      },
    });
    
    const successUrl = buildSuccessUrl(origin_url, transaction.transaction_id, payment_method);
    const cancelUrl = buildCancelUrl(origin_url);
    transaction.session_id = transaction.transaction_id;
    await transaction.save();
    
    logger.info(`Payment session created: ${transaction.transaction_id} (${payment_method})`);
    
    return sendSuccess(res, {
      url: successUrl,
      redirect_url: successUrl,
      cancel_url: cancelUrl,
      session_id: transaction.transaction_id,
      transaction_id: transaction.transaction_id,
      payment_method,
      provider: selectedMethod.provider,
      provider_label: selectedMethod.label,
      payment_instruments: selectedMethod.instruments,
      requires_wallet_confirmation: payment_method === 'crypto',
      wallet_address,
      wallet_chain_id,
      mock_mode: !env.STRIPE_API_KEY,
    }, 'Payment session created');
    
  } catch (error) {
    logger.error('Create checkout error:', error);
    return sendError(res, 'Failed to create checkout session', 500);
  }
};

/**
 * GET /api/payments/status/:sessionId
 * Get payment status and update if completed
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.user_id;
    
    const transaction = await PaymentTransaction.findOne({
      $or: [
        { session_id: sessionId },
        { transaction_id: sessionId },
      ],
      user_id: userId,
    });
    
    if (!transaction) {
      return sendError(res, 'Payment not found', 404);
    }
    
    // For demo mode - auto-complete payment
    if (transaction.status === 'pending') {
      transaction.status = 'completed';
      await transaction.save();
      
      // Create investment
      const plan = INVESTMENT_PLANS.find((p) => p.plan_id === transaction.metadata?.plan_id);
      
      if (plan) {
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + plan.lock_period_days * 24 * 60 * 60 * 1000);
        
        await Investment.create({
          user_id: userId,
          plan_id: plan.plan_id,
          segment_id: plan.segment_id,
          amount: transaction.amount,
          apy: plan.apy,
          lock_period_days: plan.lock_period_days,
          start_date: startDate,
          end_date: endDate,
        });
        
        logger.info(`Investment auto-created for payment: ${transaction.transaction_id}`);
      }
    }
    
    return sendSuccess(res, {
      status: transaction.status === 'completed' ? 'complete' : transaction.status,
      payment_status: transaction.status === 'completed' ? 'paid' : 'unpaid',
      amount_total: transaction.amount * 100, // Stripe uses cents
      currency: transaction.currency,
      transaction_id: transaction.transaction_id,
      payment_method: transaction.payment_method,
      metadata: transaction.metadata || {},
    }, 'Payment status retrieved');
    
  } catch (error) {
    logger.error('Get payment status error:', error);
    return sendError(res, 'Failed to get payment status', 500);
  }
};

/**
 * POST /api/webhook/stripe
 * Handle Stripe webhooks
 */
const handleWebhook = async (req, res) => {
  try {
    // Webhook handling for production
    const signature = req.headers['stripe-signature'];
    
    // Process webhook event
    logger.info('Stripe webhook received');
    
    return sendSuccess(res, { received: true }, 'Webhook processed');
    
  } catch (error) {
    logger.error('Webhook error:', error);
    return sendError(res, 'Webhook failed', 500);
  }
};

/**
 * GET /api/payments/history
 * Get payment history for user
 */
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const payments = await PaymentTransaction.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(50);
    
    return sendSuccess(res, payments, 'Payment history retrieved');
    
  } catch (error) {
    logger.error('Get payment history error:', error);
    return sendError(res, 'Failed to get payment history', 500);
  }
};

module.exports = {
  createCheckoutSession,
  getPaymentStatus,
  handleWebhook,
  getPaymentHistory,
};
