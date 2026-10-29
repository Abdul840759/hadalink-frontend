import mongoose from 'mongoose';

export const equipmentCategories = [
  'Tractor', 'Planter', 'Harvester', 'Boom sprayer', 'Tiller',
  'Mechanization service', 'Other',
];

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  publicId: { type: String, required: true, trim: true },
  width: { type: Number, min: 1 },
  height: { type: Number, min: 1 },
}, { _id: false });

const equipmentSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 140 },
  category: { type: String, enum: equipmentCategories, required: true, index: true },
  makeModel: { type: String, trim: true, maxlength: 140 },
  description: { type: String, trim: true, maxlength: 3000 },
  images: { type: [imageSchema], default: [], validate: value => value.length <= 10 },
  location: {
    state: { type: String, default: 'Plateau', trim: true },
    lga: { type: String, required: true, trim: true, maxlength: 100 },
    area: { type: String, trim: true, maxlength: 120 },
  },
  rate: { amount: { type: Number, required: true, min: 0 }, unit: { type: String, enum: ['hectare', 'day', 'hour', 'service'], default: 'hectare' } },
  services: { type: [String], default: [] },
  operatorArrangement: { type: String, enum: ['included', 'by-arrangement', 'not-included'], default: 'by-arrangement' },
  status: { type: String, enum: ['draft', 'available', 'paused'], default: 'draft', index: true },
}, { timestamps: true, versionKey: false });

equipmentSchema.index({ status: 1, category: 1, 'location.lga': 1, 'rate.amount': 1 });
equipmentSchema.index({ name: 'text', makeModel: 'text', description: 'text', 'location.lga': 'text', 'location.area': 'text' });

export default mongoose.model('Equipment', equipmentSchema);
