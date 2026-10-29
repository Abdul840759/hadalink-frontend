import mongoose from 'mongoose';

const bookingRequestSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
  service: { type: String, required: true, trim: true, maxlength: 140 },
  requestedDate: { type: Date, required: true },
  hectares: { type: Number, min: 0 },
  location: { type: String, required: true, trim: true, maxlength: 240 },
  note: { type: String, trim: true, maxlength: 2000 },
  quotedAmount: { type: Number, min: 0 },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'], default: 'pending', index: true },
  providerResponse: { type: String, trim: true, maxlength: 1000 },
  completedAt: { type: Date },
}, { timestamps: true, versionKey: false });

bookingRequestSchema.index({ provider: 1, status: 1, createdAt: -1 });
bookingRequestSchema.index({ farmer: 1, createdAt: -1 });

export default mongoose.model('BookingRequest', bookingRequestSchema);
