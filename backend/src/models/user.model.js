/**
 * User Model
 * MongoDB schema for user data
 */
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { ROLES } = require('../constants/roles');

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    default: () => `user_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    default: null,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  picture: {
    type: String,
    default: null,
  },
  password_hash: {
    type: String,
    default: null,
  },
  auth_provider: {
    type: String,
    enum: ['email', 'google', 'emergent'],
    default: 'email',
  },
  google_sub: {
    type: String,
    default: null,
    index: true,
  },
  wallet_address: {
    type: String,
    default: null,
    index: true,
  },
  wallet_type: {
    type: String,
    default: null,
  },
  chain_id: {
    type: Number,
    default: null,
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.USER,
  },
  email_verified: {
    type: Boolean,
    default: false,
  },
  phone_verified: {
    type: Boolean,
    default: false,
  },
  email_otp_hash: {
    type: String,
    default: null,
  },
  email_otp_expires_at: {
    type: Date,
    default: null,
  },
  phone_otp_hash: {
    type: String,
    default: null,
  },
  phone_otp_expires_at: {
    type: Date,
    default: null,
  },
  isKycVerified: {
    type: Boolean,
    default: false,
    index: true,
  },
  kycMethod: {
    type: String,
    enum: ['PAN', 'DIGILOCKER', null],
    default: null,
  },
  panNumber: {
    type: String,
    default: null,
  },
  aadhaarMasked: {
    type: String,
    default: null,
  },
  digilockerVerified: {
    type: Boolean,
    default: false,
  },
  kycStatus: {
    type: String,
    enum: ['NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED'],
    default: 'NOT_STARTED',
    index: true,
  },
  kycSubmittedAt: {
    type: Date,
    default: null,
  },
  verificationReferenceId: {
    type: String,
    default: null,
    index: true,
  },
  kycVerifiedName: {
    type: String,
    default: null,
  },
  kycDob: {
    type: String,
    default: null,
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
      delete ret.password_hash;
      delete ret.email_otp_hash;
      delete ret.phone_otp_hash;
      if (ret.panNumber) {
        ret.panNumberMasked = `${ret.panNumber.slice(0, 3)}***${ret.panNumber.slice(-1)}`;
        delete ret.panNumber;
      }
      return ret;
    },
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
