const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const kycLogSchema = new mongoose.Schema({
  log_id: {
    type: String,
    default: () => `kyclog_${uuidv4().replace(/-/g, '').slice(0, 14)}`,
    unique: true,
    index: true,
  },
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  method: {
    type: String,
    enum: ['PAN', 'DIGILOCKER', 'OTP', 'ADMIN'],
    required: true,
  },
  status: {
    type: String,
    enum: ['INITIATED', 'PENDING', 'VERIFIED', 'REJECTED', 'FAILED'],
    required: true,
  },
  reference_id: {
    type: String,
    default: null,
    index: true,
  },
  ip_address: {
    type: String,
    default: null,
  },
  user_agent: {
    type: String,
    default: null,
  },
  message: {
    type: String,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: {
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

kycLogSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('KycLog', kycLogSchema);
