const crypto = require('crypto');
const env = require('../config/env');

let razorpayClient = null;

const hasRazorpayCredentials = () => Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

const getRazorpayClient = () => {
  if (razorpayClient) return razorpayClient;

  if (!hasRazorpayCredentials()) {
    throw new Error('Razorpay credentials are not configured');
  }

  const Razorpay = require('razorpay');
  razorpayClient = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });

  return razorpayClient;
};

const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const client = getRazorpayClient();
  const order = await client.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency: String(currency).toUpperCase(),
    receipt,
    notes,
  });

  return order;
};

const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!hasRazorpayCredentials() || !orderId || !paymentId || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

const verifyWebhookSignature = ({ payload, signature }) => {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

const buildRazorpayCheckoutUrl = ({ keyId, orderId }) => `https://rzp.io/i/${orderId}`;

module.exports = {
  buildRazorpayCheckoutUrl,
  createOrder,
  getRazorpayClient,
  hasRazorpayCredentials,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
