import mongoose from 'mongoose';

const authIdentitySchema = new mongoose.Schema({
  provider: { type: String, enum: ['google'], required: true },
  subject: { type: String, required: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
  emailVerified: { type: Boolean, default: false },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  passwordHash: { type: String, select: false },
  actionPinHash: { type: String, select: false },
  actionPinSetAt: { type: Date },
  role: { type: String, enum: ['farmer', 'provider', 'logistics'], required: true },
  identities: { type: [authIdentitySchema], default: [] },
  profile: {
    phone: { type: String, trim: true, maxlength: 32 },
    phoneVerified: { type: Boolean, default: false },
    whatsapp: { type: String, trim: true, maxlength: 32 },
    whatsappVerified: { type: Boolean, default: false },
    businessName: { type: String, trim: true, maxlength: 140 },
    contactName: { type: String, trim: true, maxlength: 120 },
    primaryArea: { type: String, trim: true, maxlength: 120 },
    serviceAreas: { type: [String], default: [] },
    transportLoads: { type: [String], default: [] },
    transportCapacity: { type: String, trim: true, maxlength: 160 },
    vehicleDetails: { type: String, trim: true, maxlength: 240 },
    avatarUrl: { type: String, trim: true },
    avatarPublicId: { type: String, trim: true },
  },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
}, { timestamps: true, versionKey: false });

userSchema.index({ 'identities.provider': 1, 'identities.subject': 1 }, { unique: true, sparse: true });

export default mongoose.model('User', userSchema);
