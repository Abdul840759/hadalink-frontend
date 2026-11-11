import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { BookingRequest, Equipment } from '../models/index.js';
import { mongoose } from '../config/database.js';

const router = Router();
const requireDatabase = (_request, response, next) => mongoose.connection.readyState === 1
  ? next()
  : response.status(503).json({ error: 'Bookings are temporarily unavailable because the database is disconnected.' });

router.get('/', requireAuth, requireDatabase, async (request, response) => {
  if (!['farmer', 'provider'].includes(request.user.role)) return response.status(403).json({ error: 'This account cannot access equipment booking requests.' });
  const filter = request.user.role === 'provider' ? { provider: request.user._id } : { farmer: request.user._id };
  const items = await BookingRequest.find(filter).sort({ createdAt: -1 })
    .populate('farmer', 'name email profile.phone profile.whatsapp')
    .populate('provider', 'name profile.businessName profile.phone profile.whatsapp')
    .populate('transport.provider', 'name profile.businessName')
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
  const useHadalinkTransport = body.useHadalinkTransport === true;
  const transportRequirements = String(body.transportRequirements || '').trim();
  const transportFee = Number(process.env.HADALINK_TRANSPORT_FEE_NGN);
  if (useHadalinkTransport && (!Number.isSafeInteger(transportFee) || transportFee <= 0)) {
    return response.status(503).json({ error: 'HadaLink transport pricing is not available yet. Choose your own transport or try again later.' });
  }
  if (!service || service.length > 140 || !location || location.length > 240 || Number.isNaN(requestedDate.getTime()) || !Number.isFinite(hectares) || hectares <= 0 || hectares > 100000 || note.length > 2000 || transportRequirements.length > 1000) {
    return response.status(400).json({ error: 'Enter a service, valid date, field location, and farm size.' });
  }
  const equipment = await Equipment.findOne({ _id: body.equipment, status: 'available' }).select('provider services rate').lean();
  if (!equipment) return response.status(404).json({ error: 'This listing is no longer available.' });
  if (equipment.services.length && !equipment.services.includes(service)) return response.status(400).json({ error: 'Choose a service listed for this equipment.' });
  const item = await BookingRequest.create({
    farmer: request.user._id, provider: equipment.provider, equipment: body.equipment,
    service, requestedDate, hectares, location, note,
    quotedAmount: Math.round(equipment.rate.amount * hectares),
    ...(useHadalinkTransport ? { transport: { requested: true, fee: transportFee, status: 'requested', requirements: transportRequirements } } : {}),
  });
  const populated = await BookingRequest.findById(item._id)
    .populate('farmer', 'name profile.phone profile.whatsapp')
    .populate('provider', 'name profile.businessName profile.phone profile.whatsapp')
    .populate('transport.provider', 'name profile.businessName')
    .populate('equipment', 'name category images location rate services operatorArrangement').lean();
  return response.status(201).json({ data: populated });
});

router.patch('/:id/status', requireAuth, requireDatabase, async (request, response) => {
  if (request.user.role !== 'provider') return response.status(403).json({ error: 'Only providers can update booking requests.' });
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid booking request id.' });
  const status = String(request.body?.status || '').toLowerCase();
  if (!['accepted', 'declined', 'completed'].includes(status)) return response.status(400).json({ error: 'Choose a valid booking status.' });
  const current = await BookingRequest.findOne({ _id: request.params.id, provider: request.user._id }).select('status');
  if (!current) return response.status(404).json({ error: 'Booking request not found in your account.' });
  const allowedNext = current.status === 'pending' ? ['accepted', 'declined'] : current.status === 'accepted' ? ['completed'] : [];
  if (!allowedNext.includes(status)) return response.status(409).json({ error: 'This booking can no longer be moved to that status.' });
  const item = await BookingRequest.findOneAndUpdate(
    { _id: request.params.id, provider: request.user._id, status: current.status },
    { $set: { status, ...(status === 'completed' ? { completedAt: new Date() } : {}) } },
    { new: true, runValidators: true },
  ).populate('farmer', 'name email profile.phone profile.whatsapp').populate('provider', 'name profile.businessName').populate('transport.provider', 'name profile.businessName').populate('equipment', 'name category images location rate services operatorArrangement').lean();
  if (!item) return response.status(404).json({ error: 'Booking request not found in your account.' });
  return response.json({ data: item });
});

router.post('/:id/review', requireAuth, requireDatabase, async (request, response) => {
  if (request.user.role !== 'farmer') return response.status(403).json({ error: 'Only farmers can review completed bookings.' });
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid booking request id.' });
  const rating = Number(request.body?.rating);
  const text = String(request.body?.text || '').trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || text.length < 3 || text.length > 2000) {
    return response.status(400).json({ error: 'Choose a 1–5 star rating and write a review of at least 3 characters.' });
  }
  const item = await BookingRequest.findOneAndUpdate(
    { _id: request.params.id, farmer: request.user._id, status: 'completed', 'review.rating': { $exists: false } },
    { $set: { 'review.rating': rating, 'review.text': text, 'review.submittedAt': new Date() } },
    { new: true, runValidators: true },
  ).populate('farmer', 'name email').populate('provider', 'name profile.businessName').populate('transport.provider', 'name profile.businessName').populate('equipment', 'name category images location rate services operatorArrangement').lean();
  if (!item) {
    const existing = await BookingRequest.findOne({ _id: request.params.id, farmer: request.user._id }).select('status review.rating');
    if (!existing) return response.status(404).json({ error: 'Booking not found in your account.' });
    if (existing.status !== 'completed') return response.status(409).json({ error: 'You can review a booking after it has been marked complete.' });
    return response.status(409).json({ error: 'A review has already been submitted for this booking.' });
  }
  return response.json({ data: item });
});

export default router;
