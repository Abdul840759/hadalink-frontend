import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { BookingRequest, Equipment } from '../models/index.js';
import { mongoose } from '../config/database.js';

const router = Router();
const requireDatabase = (_request, response, next) => mongoose.connection.readyState === 1
  ? next()
  : response.status(503).json({ error: 'Transport requests are temporarily unavailable because the database is disconnected.' });
const requireLogistics = (request, response, next) => request.user.role === 'logistics'
  ? next()
  : response.status(403).json({ error: 'A logistics provider account is required.' });
const configuredFee = () => {
  const fee = Number(process.env.HADALINK_TRANSPORT_FEE_NGN);
  return Number.isSafeInteger(fee) && fee > 0 ? fee : null;
};

router.get('/pricing', (_request, response) => response.json({ data: { fee: configuredFee(), currency: 'NGN', method: 'fixed' } }));

router.get('/requests', requireAuth, requireLogistics, requireDatabase, async (request, response) => {
  const areas = [...new Set([...(request.user.profile?.serviceAreas || []), request.user.profile?.primaryArea].filter(Boolean))]
    .map(area => area.trim()).filter(Boolean).slice(0, 10);
  if (!areas.length) return response.json({ data: [] });
  const areaTerms = areas.map(area => new RegExp(area.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  const matchingEquipment = await Equipment.find({ status: 'available', $or: [
    { 'location.lga': { $in: areaTerms } }, { 'location.area': { $in: areaTerms } },
  ] }).distinct('_id');
  const items = await BookingRequest.find({
    'transport.requested': true,
    'transport.status': 'requested',
    'transport.provider': null,
    'transport.declinedBy': { $ne: request.user._id },
    $or: [{ location: { $in: areaTerms } }, { equipment: { $in: matchingEquipment } }],
  }).sort({ requestedDate: 1 }).populate('farmer', 'name')
    .populate('provider', 'name profile.businessName').populate('equipment', 'name category location images').lean();
  return response.json({ data: items });
});

router.get('/jobs', requireAuth, requireLogistics, requireDatabase, async (request, response) => {
  const items = await BookingRequest.find({ 'transport.provider': request.user._id })
    .sort({ requestedDate: 1 }).populate('farmer', 'name email profile.phone profile.whatsapp')
    .populate('provider', 'name profile.businessName').populate('equipment', 'name category location images').lean();
  return response.json({ data: items });
});

router.patch('/:id/decision', requireAuth, requireLogistics, requireDatabase, async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid transport request.' });
  const decision = String(request.body?.decision || '').toLowerCase();
  if (!['accept', 'decline'].includes(decision)) return response.status(400).json({ error: 'Choose accept or decline.' });
  const base = { _id: request.params.id, 'transport.requested': true, 'transport.status': 'requested', 'transport.provider': null, 'transport.declinedBy': { $ne: request.user._id } };
  let item;
  if (decision === 'decline') {
    item = await BookingRequest.findOneAndUpdate(base, { $addToSet: { 'transport.declinedBy': request.user._id } }, { new: true, runValidators: true });
  } else {
    item = await BookingRequest.findOneAndUpdate(base, { $set: { 'transport.provider': request.user._id, 'transport.status': 'accepted' } }, { new: true, runValidators: true });
  }
  if (!item) return response.status(409).json({ error: 'This transport request has already been accepted or is no longer available.' });
  const populated = await BookingRequest.findById(item._id).populate('farmer', 'name email profile.phone profile.whatsapp')
    .populate('provider', 'name profile.businessName').populate('equipment', 'name category location images').lean();
  return response.json({ data: populated });
});

router.patch('/:id/status', requireAuth, requireLogistics, requireDatabase, async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid transport job.' });
  const transitions = { accepted: 'scheduled', scheduled: 'picked_up', picked_up: 'in_transit', in_transit: 'delivered' };
  const currentStatus = String(request.body?.status || '').toLowerCase();
  if (!Object.hasOwn(transitions, currentStatus)) return response.status(400).json({ error: 'Choose the next available delivery status.' });
  const nextStatus = transitions[currentStatus];
  const timestampField = { scheduled: 'scheduledAt', picked_up: 'pickedUpAt', in_transit: 'inTransitAt', delivered: 'deliveredAt' }[nextStatus];
  const deliveryNote = String(request.body?.deliveryNote || '').trim();
  if (deliveryNote.length > 1000) return response.status(400).json({ error: 'Delivery notes must be 1,000 characters or fewer.' });
  const item = await BookingRequest.findOneAndUpdate(
    { _id: request.params.id, 'transport.provider': request.user._id, 'transport.status': currentStatus },
    { $set: { 'transport.status': nextStatus, [`transport.${timestampField}`]: new Date(), ...(nextStatus === 'delivered' && deliveryNote ? { 'transport.deliveryNote': deliveryNote } : {}) } },
    { new: true, runValidators: true },
  ).populate('farmer', 'name email profile.phone profile.whatsapp').populate('provider', 'name profile.businessName')
    .populate('equipment', 'name category location images').lean();
  if (!item) return response.status(409).json({ error: 'This job is not assigned to you or has moved to another status.' });
  return response.json({ data: item });
});

router.get('/profile', requireAuth, requireLogistics, async (request, response) => response.json({ data: { profile: request.user.profile } }));

router.patch('/profile', requireAuth, requireLogistics, requireDatabase, async (request, response) => {
  const body = request.body || {};
  const companyName = String(body.businessName || '').trim();
  const contactName = String(body.contactName || '').trim();
  const primaryArea = String(body.primaryArea || '').trim();
  const areas = Array.isArray(body.serviceAreas) ? [...new Set(body.serviceAreas.map(value => String(value).trim()).filter(Boolean))].slice(0, 10) : [];
  const loads = Array.isArray(body.transportLoads) ? [...new Set(body.transportLoads.map(value => String(value).trim()).filter(Boolean))].slice(0, 20) : [];
  const capacity = String(body.transportCapacity || '').trim();
  const vehicleDetails = String(body.vehicleDetails || '').trim();
  if (companyName.length < 2 || companyName.length > 140 || contactName.length < 2 || contactName.length > 120 || !primaryArea || primaryArea.length > 120 || areas.some(area => area.length > 120) || loads.some(load => load.length > 80) || capacity.length > 160 || vehicleDetails.length > 240) {
    return response.status(400).json({ error: 'Enter a company name, contact person, operating area, and valid transport details.' });
  }
  const profile = {
    ...request.user.profile.toObject(), businessName: companyName, contactName, primaryArea,
    serviceAreas: areas.length ? areas : [primaryArea], transportLoads: loads,
    transportCapacity: capacity, vehicleDetails,
  };
  request.user.profile = profile;
  await request.user.save();
  return response.json({ data: { profile: request.user.profile } });
});

export default router;
