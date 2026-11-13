import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { requireActionPinFor } from '../middleware/requireActionPin.js';
import { BookingRequest, User } from '../models/index.js';
import { mongoose } from '../config/database.js';

const router = Router();
const PAYSTACK_API = 'https://api.paystack.co';
const frontendOrigin = () => (process.env.FRONTEND_ORIGIN || 'https://haddalink.vercel.app').split(',')[0].trim().replace(/\/$/, '');
const testSecret = () => process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_') ? process.env.PAYSTACK_SECRET_KEY : '';

async function paystackRequest(path, options = {}) {
  const secret = testSecret();
  if (!secret) {
    const error = new Error('Paystack test mode is not configured on the server.');
    error.status = 503;
    throw error;
  }
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', ...options.headers },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.status !== true) {
    const error = new Error('Paystack could not complete the payment request. Check the test key and try again.');
    error.status = 502;
    throw error;
  }
  return payload.data;
}

function amountFor(booking) {
  const totalNaira = Number(booking.quotedAmount || 0) + (booking.transport?.requested ? Number(booking.transport?.fee || 0) : 0);
  const amountKobo = Math.round(totalNaira * 100);
  if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
    const error = new Error('This booking does not have a valid payable amount.');
    error.status = 400;
    throw error;
  }
  return amountKobo;
}

router.post('/bookings/:id/initialize', requireAuth, requireActionPinFor('farmer'), async (request, response) => {
  if (request.user.role !== 'farmer') return response.status(403).json({ error: 'Only farmers can pay for a booking.' });
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid booking id.' });
  const booking = await BookingRequest.findOne({ _id: request.params.id, farmer: request.user._id }).select('status quotedAmount transport payment').lean();
  if (!booking) return response.status(404).json({ error: 'Booking not found in your account.' });
  if (booking.status !== 'accepted') return response.status(409).json({ error: 'Payment is available after the provider accepts the booking.' });
  if (booking.payment?.status === 'paid') return response.status(409).json({ error: 'This booking is already paid.' });
  const amountKobo = amountFor(booking);
  const user = await User.findById(request.user._id).select('email').lean();
  if (!user?.email) return response.status(400).json({ error: 'Add an email address to your account before paying.' });
  const reference = `hdl_${Date.now()}_${randomBytes(10).toString('hex')}`;
  const reservation = await BookingRequest.updateOne(
    { _id: booking._id, farmer: request.user._id, status: 'accepted', 'payment.status': { $ne: 'paid' } },
    { $set: { 'payment.status': 'pending', 'payment.reference': reference, 'payment.amountKobo': amountKobo, 'payment.currency': 'NGN' } },
  );
  if (!reservation.matchedCount) return response.status(409).json({ error: 'This booking is no longer available for payment. Refresh your bookings.' });
  let transaction;
  try {
    transaction = await paystackRequest('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        amount: amountKobo,
        currency: 'NGN',
        reference,
        callback_url: `${frontendOrigin()}/app/bookings`,
        metadata: { bookingId: String(booking._id), purpose: 'equipment_booking' },
      }),
    });
  } catch (error) {
    await BookingRequest.updateOne(
      { _id: booking._id, 'payment.reference': reference, 'payment.status': 'pending' },
      { $set: { 'payment.status': 'unpaid' }, $unset: { 'payment.reference': 1, 'payment.amountKobo': 1 } },
    );
    throw error;
  }
  return response.json({ data: { authorizationUrl: transaction.authorization_url, reference } });
});

router.get('/verify', requireAuth, async (request, response) => {
  if (request.user.role !== 'farmer') return response.status(403).json({ error: 'Only the farmer who booked can verify this payment.' });
  const reference = String(request.query.reference || '').trim();
  if (!/^hdl_[A-Za-z0-9_-]{10,80}$/.test(reference)) return response.status(400).json({ error: 'Invalid payment reference.' });
  const booking = await BookingRequest.findOne({ farmer: request.user._id, 'payment.reference': reference });
  if (!booking) return response.status(404).json({ error: 'Payment reference not found for your account.' });
  if (booking.payment?.status === 'paid') return response.json({ data: { status: 'paid', bookingId: String(booking._id) } });
  const result = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`, { method: 'GET' });
  const expectedAmount = booking.payment?.amountKobo;
  if (result.status !== 'success') return response.status(409).json({ error: 'Paystack has not confirmed a successful payment yet.', paymentStatus: result.status });
  if (result.domain !== 'test' || result.reference !== reference || result.currency !== 'NGN' || result.amount !== expectedAmount) {
    return response.status(409).json({ error: 'The payment details did not match this test booking. Contact support before retrying.' });
  }
  booking.payment.status = 'paid';
  booking.payment.transactionId = String(result.id);
  booking.payment.paidAt = result.paid_at ? new Date(result.paid_at) : new Date();
  await booking.save();
  return response.json({ data: { status: 'paid', bookingId: String(booking._id) } });
});

export async function handlePaystackWebhook(request, response) {
  const secret = testSecret();
  const signature = request.get('x-paystack-signature') || '';
  if (!secret || !Buffer.isBuffer(request.body) || !/^[a-f0-9]{128}$/i.test(signature)) return response.sendStatus(401);
  const expected = createHmac('sha512', secret).update(request.body).digest();
  const supplied = Buffer.from(signature, 'hex');
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return response.sendStatus(401);
  let event;
  try { event = JSON.parse(request.body.toString('utf8')); } catch { return response.sendStatus(400); }
  if (event.event !== 'charge.success' || event.data?.domain !== 'test') return response.sendStatus(200);
  const transaction = event.data;
  const booking = await BookingRequest.findOne({ 'payment.reference': transaction.reference });
  if (!booking || booking.payment?.status === 'paid') return response.sendStatus(200);
  if (transaction.status !== 'success' || transaction.currency !== 'NGN' || transaction.amount !== booking.payment?.amountKobo) return response.sendStatus(200);
  booking.payment.status = 'paid';
  booking.payment.transactionId = String(transaction.id);
  booking.payment.paidAt = transaction.paid_at ? new Date(transaction.paid_at) : new Date();
  await booking.save();
  return response.sendStatus(200);
}

export default router;
