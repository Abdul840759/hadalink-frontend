import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import User from '../models/User.js';

export const actionPinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many PIN attempts. Wait 15 minutes and try again.' },
});

export async function checkActionPin(userId, pin) {
  const user = await User.findById(userId).select('+actionPinHash');
  if (!user?.actionPinHash) return { ok: false, configured: false };
  const ok = typeof pin === 'string' && /^\d{6}$/.test(pin)
    ? await bcrypt.compare(pin, user.actionPinHash)
    : false;
  return { ok, configured: true };
}

async function requireActionPin(request, response, next) {
  try {
    const result = await checkActionPin(request.user._id, request.body?.actionPin);
    if (!result.configured) return response.status(428).json({ error: 'Create an action PIN before continuing.' });
    if (!result.ok) return response.status(403).json({ error: 'The action PIN is incorrect.' });
    return next();
  } catch (error) {
    return next(error);
  }
}

export const requireActionPinFor = (...roles) => (request, response, next) => {
  if (!roles.includes(request.user?.role)) return response.status(403).json({ error: 'This account cannot perform that protected action.' });
  return actionPinLimiter(request, response, () => requireActionPin(request, response, next));
};

export default requireActionPin;
