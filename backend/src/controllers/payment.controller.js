const { PaymentTransaction, Investment } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { INVESTMENT_PLANS } = require('./segments.controller');
const env = require('../config/env');
const logger = require('../utils/logger');
const {
  getInvestorProfileLabel,
  getAllowedPaymentMethodForInvestorProfile,
} = require('../utils/investorProfile');
const {
  createQuoteForToken,
  getChainConfig,
  getConfiguredTokens,
  normalizeAddress,
  verifyCryptoTransfer,
} = require('../services/cryptoPayment.service');
const razorpayService = require('../services/razorpay.service');

const PAYMENT_METHODS = {
  gateway: {
    provider: 'RAZORPAY',
    label: 'Razorpay Checkout',
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

const getPlanById = (planId) => INVESTMENT_PLANS.find((plan) => plan.plan_id === planId) || null;

const createInvestmentForTransaction = async (transaction) => {
  if (transaction.metadata?.investment_id) {
    return transaction.metadata.investment_id;
  }

  const plan = getPlanById(transaction.metadata?.plan_id);
  if (!plan) {
    throw new Error('Plan not found for payment transaction');
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + plan.lock_period_days * 24 * 60 * 60 * 1000);
  const investment = await Investment.create({
    user_id: transaction.user_id,
    plan_id: plan.plan_id,
    segment_id: plan.segment_id,
    amount: transaction.amount,
    apy: plan.apy,
    lock_period_days: plan.lock_period_days,
    start_date: startDate,
    end_date: endDate,
  });

  transaction.metadata = {
    ...(transaction.metadata || {}),
    investment_id: investment.investment_id,
  };
  await transaction.save();
  return investment.investment_id;
};

const serializePaymentStatus = (transaction, overrides = {}) => ({
  status: overrides.status || transaction.status,
  payment_status:
    overrides.payment_status ||
    (transaction.status === 'completed' ? 'paid' : transaction.status === 'failed' ? 'failed' : 'unpaid'),
  amount_total: Math.round(Number(transaction.amount || 0) * 100),
  currency: transaction.currency,
  transaction_id: transaction.transaction_id,
  payment_method: transaction.payment_method,
  confirmations:
    overrides.confirmations ??
    Number(transaction.metadata?.crypto?.confirmations || 0),
  explorer_url: overrides.explorer_url || transaction.metadata?.crypto?.explorer_url || '',
  metadata: transaction.metadata || {},
});

const getPaymentOptions = async (req, res) => {
  const chain = getChainConfig();
  const supportedTokens = getConfiguredTokens().map((token) => ({
    symbol: token.symbol,
    name: token.name || token.symbol,
    type: token.type,
    decimals: token.decimals,
    address: token.address || null,
    pricing: token.pricing,
    configured: token.type === 'native' || Boolean(token.address),
  }));
  const treasuryConfigured = Boolean(env.CRYPTO_TREASURY_ADDRESS);

  return sendSuccess(res, {
    crypto_enabled: env.CRYPTO_PAYMENTS_ENABLED,
    chain: {
      key: chain.key,
      chain_id: chain.chainId,
      name: chain.name,
      explorer_base_url: chain.explorerBaseUrl,
    },
    supported_tokens: supportedTokens,
    supported_display_currencies: env.CRYPTO_SUPPORTED_FIAT_CURRENCIES,
    base_currency: env.CRYPTO_FIAT_BASE_CURRENCY,
    required_confirmations: env.CRYPTO_REQUIRED_CONFIRMATIONS,
    treasury_configured: treasuryConfigured,
    crypto_ready: treasuryConfigured && supportedTokens.some((token) => token.configured),
  }, 'Payment options retrieved');
};

/**
 * POST /api/payments/checkout
 * Create a hosted gateway or Web3 transfer intent
 */
const createCheckoutSession = async (req, res) => {
  try {
    const {
      plan_id,
      amount,
      origin_url,
      payment_method = 'gateway',
      investor_profile = 'domestic',
      wallet_address = null,
      wallet_chain_id = null,
      wallet_type = null,
      token_symbol = null,
      display_currency = env.CRYPTO_FIAT_BASE_CURRENCY,
    } = req.body;
    const userId = req.user.user_id;
    const normalizedInvestorProfile = String(investor_profile || 'domestic').trim().toLowerCase();
    const allowedPaymentMethods = getAllowedPaymentMethodForInvestorProfile(normalizedInvestorProfile);
    const requestedPaymentMethod = String(payment_method || '').trim().toLowerCase();

    if (!allowedPaymentMethods.length) {
      return sendError(res, 'Investor profile is not supported', 400);
    }

    if (requestedPaymentMethod && !allowedPaymentMethods.includes(requestedPaymentMethod)) {
      return sendError(
        res,
        `${getInvestorProfileLabel(normalizedInvestorProfile)} can only use ${allowedPaymentMethods.join(', ')} payment`,
        400
      );
    }

    const resolvedPaymentMethod = requestedPaymentMethod || allowedPaymentMethods[0];
    const selectedMethod = PAYMENT_METHODS[resolvedPaymentMethod];

    if (normalizedInvestorProfile === 'international') {
      return sendError(
        res,
        'International crypto payments are coming soon. Please complete onboarding for now and check back when this payment path is enabled.',
        409
      );
    }

    const plan = getPlanById(plan_id);
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

    if (resolvedPaymentMethod === 'crypto') {
      if (!env.CRYPTO_PAYMENTS_ENABLED) {
        return sendError(res, 'Crypto payments are disabled', 400);
      }

      if (!wallet_address) {
        return sendError(res, 'Connect a wallet before using Web3 payment', 400);
      }

      if (!token_symbol) {
        return sendError(res, 'token_symbol required for Web3 payment', 400);
      }
    }

    const baseMetadata = {
      plan_id,
      segment_id: plan.segment_id,
      provider: selectedMethod.provider,
      provider_label: selectedMethod.label,
      payment_instruments: selectedMethod.instruments,
      investor_profile: normalizedInvestorProfile,
      investor_profile_label: getInvestorProfileLabel(normalizedInvestorProfile),
      wallet_address: normalizeAddress(wallet_address),
      wallet_chain_id,
      wallet_type,
    };

    let status = 'pending';
    let cryptoQuote = null;
    let razorpayOrder = null;
    const razorpayConfigured = razorpayService.hasRazorpayCredentials();
    const gatewayMockMode =
      resolvedPaymentMethod === 'gateway' && !razorpayConfigured && env.RAZORPAY_MOCK_MODE;

    if (resolvedPaymentMethod === 'gateway' && !razorpayConfigured && !gatewayMockMode) {
      return sendError(
        res,
        'Domestic checkout is not configured yet. Add Razorpay credentials to enable live fiat payments.',
        503
      );
    }

    if (resolvedPaymentMethod === 'crypto') {
      cryptoQuote = await createQuoteForToken({
        amountInBaseCurrency: investmentAmount,
        displayCurrency: display_currency,
        tokenSymbol: token_symbol,
      });
      status = 'awaiting_transfer';
    }

    const transaction = await PaymentTransaction.create({
      user_id: userId,
      amount: investmentAmount,
      currency: env.CRYPTO_FIAT_BASE_CURRENCY.toLowerCase(),
      payment_method: resolvedPaymentMethod,
      status,
      metadata: {
        ...baseMetadata,
        display_currency: String(display_currency || env.CRYPTO_FIAT_BASE_CURRENCY).toUpperCase(),
        razorpay:
          resolvedPaymentMethod === 'gateway'
            ? {
                mock_mode: gatewayMockMode,
                status: gatewayMockMode ? 'mock_ready' : 'created',
              }
            : undefined,
        crypto: cryptoQuote
          ? {
              ...cryptoQuote,
              status: 'awaiting_transfer',
              tx_hash: null,
              confirmations: 0,
              explorer_url: '',
            }
          : undefined,
      },
    });

    const successUrl = buildSuccessUrl(origin_url, transaction.transaction_id, resolvedPaymentMethod);
    const cancelUrl = buildCancelUrl(origin_url);

    if (resolvedPaymentMethod === 'gateway') {
      if (!gatewayMockMode) {
        try {
          razorpayOrder = await razorpayService.createOrder({
            amount: investmentAmount,
            currency: env.RAZORPAY_CURRENCY || env.CRYPTO_FIAT_BASE_CURRENCY,
            receipt: transaction.transaction_id,
            notes: {
              user_id: userId,
              plan_id,
              segment_id: plan.segment_id,
              investor_profile: normalizedInvestorProfile,
            },
          });

          transaction.metadata = {
            ...(transaction.metadata || {}),
            razorpay: {
              order_id: razorpayOrder.id,
              amount: razorpayOrder.amount,
              currency: razorpayOrder.currency,
              status: razorpayOrder.status,
              mock_mode: false,
            },
          };
        } catch (paymentError) {
          logger.error('Razorpay order creation failed', paymentError);
          return sendError(res, 'Unable to start Razorpay payment right now', 502);
        }
      }
    }

    transaction.session_id = transaction.transaction_id;
    await transaction.save();

    logger.info(`Payment session created: ${transaction.transaction_id} (${payment_method})`);

    const response = {
      url: resolvedPaymentMethod === 'gateway' && gatewayMockMode ? successUrl : null,
      redirect_url: resolvedPaymentMethod === 'gateway' && gatewayMockMode ? successUrl : null,
      cancel_url: cancelUrl,
      session_id: transaction.transaction_id,
      transaction_id: transaction.transaction_id,
      payment_method: resolvedPaymentMethod,
      provider: selectedMethod.provider,
      provider_label: selectedMethod.label,
      payment_instruments: selectedMethod.instruments,
      investor_profile: normalizedInvestorProfile,
      investor_profile_label: getInvestorProfileLabel(normalizedInvestorProfile),
      allowed_payment_methods: allowedPaymentMethods,
      requires_wallet_confirmation: resolvedPaymentMethod === 'crypto',
      wallet_address: normalizeAddress(wallet_address),
      wallet_chain_id,
      mock_mode: resolvedPaymentMethod === 'gateway' ? gatewayMockMode : false,
      supported_display_currencies: env.CRYPTO_SUPPORTED_FIAT_CURRENCIES,
      quote: cryptoQuote,
      razorpay: razorpayOrder
        ? {
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key_id: env.RAZORPAY_KEY_ID,
            name: 'Investyz',
            description: `Investment in ${plan.name}`,
            success_url: env.RAZORPAY_SUCCESS_URL || successUrl,
            cancel_url: env.RAZORPAY_CANCEL_URL || cancelUrl,
          }
        : gatewayMockMode
          ? {
              mock_mode: true,
              success_url: successUrl,
              cancel_url: cancelUrl,
            }
          : null,
    };

    return sendSuccess(res, response, 'Payment session created');
  } catch (error) {
    logger.error('Create checkout error:', error);
    return sendError(res, error.message || 'Failed to create checkout session', 500);
  }
};

/**
 * POST /api/payments/confirm
 * Verify a submitted crypto transfer by tx hash
 */
const confirmCryptoPayment = async (req, res) => {
  try {
    const { session_id, transaction_id, tx_hash } = req.body;
    const userId = req.user.user_id;
    const lookupId = session_id || transaction_id;

    if (!lookupId || !tx_hash) {
      return sendError(res, 'session_id and tx_hash are required', 400);
    }

    const transaction = await PaymentTransaction.findOne({
      $or: [{ session_id: lookupId }, { transaction_id: lookupId }],
      user_id: userId,
      payment_method: 'crypto',
    });

    if (!transaction) {
      return sendError(res, 'Crypto payment not found', 404);
    }

    const quote = transaction.metadata?.crypto;
    if (!quote) {
      return sendError(res, 'Crypto quote missing for this payment', 400);
    }

    const verification = await verifyCryptoTransfer({
      txHash: tx_hash,
      expectedFrom: transaction.metadata?.wallet_address,
      quote,
    });

    transaction.status = verification.status;
    transaction.metadata = {
      ...(transaction.metadata || {}),
      crypto: {
        ...(transaction.metadata?.crypto || {}),
        tx_hash,
        confirmations: verification.confirmations,
        explorer_url: verification.explorer_url,
        verified_at: new Date().toISOString(),
        verification_reason: verification.reason,
        block_number: verification.block_number ?? null,
        status: verification.status,
      },
    };

    if (verification.status === 'completed') {
      await createInvestmentForTransaction(transaction);
    }

    await transaction.save();

    return sendSuccess(
      res,
      serializePaymentStatus(transaction, verification),
      verification.status === 'completed' ? 'Crypto payment confirmed' : 'Crypto payment submitted'
    );
  } catch (error) {
    logger.error('Confirm crypto payment error:', error);
    return sendError(res, error.message || 'Failed to verify crypto payment', 500);
  }
};

/**
 * POST /api/payments/verify-razorpay
 * Verify Razorpay payment signature and complete the investment
 */
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      session_id,
      transaction_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;
    const userId = req.user.user_id;
    const lookupId = session_id || transaction_id;

    if (!lookupId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendError(
        res,
        'session_id, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
        400
      );
    }

    const transaction = await PaymentTransaction.findOne({
      $or: [{ session_id: lookupId }, { transaction_id: lookupId }],
      user_id: userId,
      payment_method: 'gateway',
    });

    if (!transaction) {
      return sendError(res, 'Payment not found', 404);
    }

    const expectedOrderId = transaction.metadata?.razorpay?.order_id;
    if (!expectedOrderId) {
      return sendError(res, 'Razorpay order is missing for this transaction', 400);
    }

    if (expectedOrderId !== razorpay_order_id) {
      return sendError(res, 'Razorpay order mismatch', 400);
    }

    const signatureValid = razorpayService.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!signatureValid) {
      transaction.status = 'failed';
      transaction.metadata = {
        ...(transaction.metadata || {}),
        razorpay: {
          ...(transaction.metadata?.razorpay || {}),
          payment_id: razorpay_payment_id,
          signature_valid: false,
        },
      };
      await transaction.save();
      return sendError(res, 'Unable to verify Razorpay payment', 400);
    }

    transaction.status = 'completed';
    transaction.metadata = {
      ...(transaction.metadata || {}),
      razorpay: {
        ...(transaction.metadata?.razorpay || {}),
        payment_id: razorpay_payment_id,
        signature_valid: true,
        verified_at: new Date().toISOString(),
        status: 'paid',
      },
    };

    await createInvestmentForTransaction(transaction);
    await transaction.save();

    return sendSuccess(res, serializePaymentStatus(transaction), 'Razorpay payment verified');
  } catch (error) {
    logger.error('Verify Razorpay payment error:', error);
    return sendError(res, error.message || 'Failed to verify Razorpay payment', 500);
  }
};

/**
 * GET /api/payments/status/:sessionId
 * Get payment status and refresh on-chain verification when possible
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.user_id;

    const transaction = await PaymentTransaction.findOne({
      $or: [{ session_id: sessionId }, { transaction_id: sessionId }],
      user_id: userId,
    });

    if (!transaction) {
      return sendError(res, 'Payment not found', 404);
    }

    if (
      transaction.payment_method === 'gateway' &&
      transaction.status === 'pending' &&
      transaction.metadata?.razorpay?.mock_mode
    ) {
      transaction.status = 'completed';
      await createInvestmentForTransaction(transaction);
      await transaction.save();
    }

    if (
      transaction.payment_method === 'crypto' &&
      transaction.metadata?.crypto?.tx_hash &&
      ['submitted', 'confirming', 'awaiting_transfer'].includes(transaction.status)
    ) {
      const verification = await verifyCryptoTransfer({
        txHash: transaction.metadata.crypto.tx_hash,
        expectedFrom: transaction.metadata?.wallet_address,
        quote: transaction.metadata.crypto,
      });

      transaction.status = verification.status;
      transaction.metadata = {
        ...(transaction.metadata || {}),
        crypto: {
          ...(transaction.metadata?.crypto || {}),
          confirmations: verification.confirmations,
          explorer_url: verification.explorer_url,
          verification_reason: verification.reason,
          block_number: verification.block_number ?? null,
          status: verification.status,
        },
      };

      if (verification.status === 'completed') {
        await createInvestmentForTransaction(transaction);
      }

      await transaction.save();
      return sendSuccess(
        res,
        serializePaymentStatus(transaction, verification),
        'Payment status retrieved'
      );
    }

    return sendSuccess(res, serializePaymentStatus(transaction), 'Payment status retrieved');
  } catch (error) {
    logger.error('Get payment status error:', error);
    return sendError(res, error.message || 'Failed to get payment status', 500);
  }
};

/**
 * POST /api/webhook/stripe
 * Handle Stripe webhooks
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    logger.info('Stripe webhook received', { signaturePresent: Boolean(signature) });
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
  confirmCryptoPayment,
  createCheckoutSession,
  getPaymentHistory,
  getPaymentOptions,
  getPaymentStatus,
  handleWebhook,
  verifyRazorpayPayment,
};
