const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const verificationSessionSchema = new mongoose.Schema({
  verification_session_id: {
    type: String,
    default: () => `vs_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
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
    enum: ['PAN', 'DIGILOCKER'],
    required: true,
  },
  provider: {
    type: String,
    default: 'DECENTRO',
  },
  provider_reference_id: {
    type: String,
    default: null,
    index: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'FAILED'],
    default: 'PENDING',
    index: true,
  },
  redirect_url: {
    type: String,
    default: null,
  },
  request_payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  response_payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  expires_at: {
    type: Date,
    default: null,
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

verificationSessionSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('VerificationSession', verificationSessionSchema);
