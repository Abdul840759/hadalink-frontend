import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { BookingRequest, Equipment } from '../models/index.js';
import { mongoose } from '../config/database.js';

const router = Router();
const requireDatabase = (_request, response, next) => mongoose.connection.readyState === 1
  ? next()
  : response.status(503).json({ error: 'Bookings are temporarily unavailable because the database is disconnected.' });

router.get('/', requireAuth, requireDatabase, async (request, response) => {
  const filter = request.user.role === 'provider' ? { provider: request.user._id } : { farmer: request.user._id };
  const items = await BookingRequest.find(filter).sort({ createdAt: -1 })
    .populate('farmer', 'name profile.phone profile.whatsapp')
    .populate('provider', 'name profile.businessName profile.phone profile.whatsapp')
    .populate('equipment', 'name category images location rate services operatorArrangement')
    .lean();
  return response.json({ data: items });
});

router.post('/', requireAuth, requireDatabase, async (request, response) => {
  if (request.user.role !== 'farmer') return response.status(403).json({ error: 'Only farmer accounts can request equipment.' });
  const body = request.body || {};
  if (!mongoose.isValidObjectId(body.equipment)) return response.status(400).json({ error: 'Choose a valid equipment listing.' });
  const service = String(body.service || '').trim();
  const location = String(body.location || '').trim();
  const requestedDate = new Date(body.requestedDate);
  const hectares = Number(body.hectares);
  const note = String(body.note || '').trim();
  if (!service || service.length > 140 || !location || location.length > 240 || Number.isNaN(requestedDate.getTime()) || !Number.isFinite(hectares) || hectares <= 0 || hectares > 100000 || note.length > 2000) {
    return response.status(400).json({ error: 'Enter a service, valid date, field location, and farm size.' });
  }
  const equipment = await Equipment.findOne({ _id: body.equipment, status: 'available' }).select('provider services rate').lean();
  if (!equipment) return response.status(404).json({ error: 'This listing is no longer available.' });
  if (equipment.services.length && !equipment.services.includes(service)) return response.status(400).json({ error: 'Choose a service listed for this equipment.' });
  const item = await BookingRequest.create({
    farmer: request.user._id, provider: equipment.provider, equipment: body.equipment,
    service, requestedDate, hectares, location, note,
    quotedAmount: Math.round(equipment.rate.amount * hectares),
  });
  const populated = await BookingRequest.findById(item._id)
    .populate('farmer', 'name profile.phone profile.whatsapp')
    .populate('provider', 'name profile.businessName profile.phone profile.whatsapp')
    .populate('equipment', 'name category images location rate services operatorArrangement').lean();
  return response.status(201).json({ data: populated });
});

router.patch('/:id/status', requireAuth, requireDatabase, async (request, response) => {
  if (request.user.role !== 'provider') return response.status(403).json({ error: 'Only providers can update booking requests.' });
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid booking request id.' });
  const status = String(request.body?.status || '').toLowerCase();
  if (!['accepted', 'declined', 'completed'].includes(status)) return response.status(400).json({ error: 'Choose a valid booking status.' });
  const item = await BookingRequest.findOneAndUpdate(
    { _id: request.params.id, provider: request.user._id },
    { $set: { status, ...(status === 'completed' ? { completedAt: new Date() } : {}) } },
    { new: true, runValidators: true },
  ).populate('farmer', 'name').populate('equipment', 'name').lean();
  if (!item) return response.status(404).json({ error: 'Booking request not found in your account.' });
  return response.json({ data: item });
});

export default router;
