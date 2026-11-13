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
  payment: {
    status: { type: String, enum: ['unpaid', 'pending', 'paid'], default: 'unpaid' },
    reference: { type: String, trim: true, maxlength: 100 },
    amountKobo: { type: Number, min: 0 },
    currency: { type: String, enum: ['NGN'], default: 'NGN' },
    transactionId: { type: String, trim: true, maxlength: 80 },
    paidAt: { type: Date },
  },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'], default: 'pending', index: true },
  providerResponse: { type: String, trim: true, maxlength: 1000 },
  completedAt: { type: Date },
  review: {
    rating: { type: Number, min: 1, max: 5 },
    text: { type: String, trim: true, maxlength: 2000 },
    submittedAt: { type: Date },
  },
  transport: {
    requested: { type: Boolean, default: false, index: true },
    fee: { type: Number, min: 0 },
    status: { type: String, enum: ['not_requested', 'requested', 'accepted', 'scheduled', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'unfulfilled'], default: 'not_requested', index: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    declinedBy: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    scheduledAt: { type: Date },
    pickedUpAt: { type: Date },
    inTransitAt: { type: Date },
    deliveredAt: { type: Date },
    deliveryNote: { type: String, trim: true, maxlength: 1000 },
    requirements: { type: String, trim: true, maxlength: 1000 },
    liveLocation: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      accuracy: { type: Number, min: 0 },
      updatedAt: { type: Date },
    },
  },
}, { timestamps: true, versionKey: false });

bookingRequestSchema.index({ provider: 1, status: 1, createdAt: -1 });
bookingRequestSchema.index({ farmer: 1, createdAt: -1 });

export default mongoose.model('BookingRequest', bookingRequestSchema);
