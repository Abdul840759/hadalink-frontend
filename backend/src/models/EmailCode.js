import mongoose from 'mongoose';

const emailCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  codeHash: { type: String, required: true },
  purpose: { type: String, enum: ['sign-up', 'password-reset'], required: true },
  pendingName: { type: String, trim: true, maxlength: 120 },
  pendingRole: { type: String, enum: ['farmer', 'provider'] },
  pendingPasswordHash: { type: String, select: false },
  attempts: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  consumedAt: { type: Date },
}, { timestamps: true, versionKey: false });

emailCodeSchema.index({ email: 1, purpose: 1, createdAt: -1 });

export default mongoose.model('EmailCode', emailCodeSchema);
