/**
 * KYC Verification Model
 * Stores DigiLocker verification session metadata and status
 */
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const kycVerificationSchema = new mongoose.Schema({
  kyc_verification_id: {
    type: String,
    default: () => `kyc_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
    unique: true,
    index: true,
  },
  customer_id: {
    type: String,
    default: null,
    index: true,
  },
  customer_email: {
    type: String,
    default: null,
    lowercase: true,
    trim: true,
    index: true,
  },
  customer_name: {
    type: String,
    default: null,
    trim: true,
  },
  reference_id: {
    type: Number,
    default: null,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'authenticated', 'expired', 'consent_denied', 'failed'],
    default: 'pending',
  },
  document_requested: {
    type: [String],
    default: ['AADHAAR', 'PAN'],
  },
  document_consent: {
    type: [String],
    default: [],
  },
  document_consent_validity: {
    type: Date,
    default: null,
  },
  cashfree_user_details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  redirect_url: {
    type: String,
    default: null,
  },
  user_flow: {
    type: String,
    enum: ['signin', 'signup'],
    default: 'signup',
  },
  cashfree_url: {
    type: String,
    default: null,
  },
  cashfree_payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

kycVerificationSchema.index({ customer_id: 1, created_at: -1 });

const KycVerification = mongoose.model('KycVerification', kycVerificationSchema);

module.exports = KycVerification;
