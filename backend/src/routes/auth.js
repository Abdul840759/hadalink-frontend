import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { rateLimit } from 'express-rate-limit';
import { Router } from 'express';
import { EmailCode, User } from '../models/index.js';
import requireAuth from '../middleware/requireAuth.js';
import { sendEmailCode } from '../services/email.js';
import { createSession, destroySession, publicUser } from '../services/sessions.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
const codeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = value => String(value || '').trim().toLowerCase();
const passwordIsValid = value => typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value, 'utf8') <= 72;

function codeDigest(email, purpose, code) {
  const secret = process.env.CODE_HASH_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    const error = new Error('Authentication secrets are not configured.');
    error.status = 503;
    throw error;
  }
  return createHmac('sha256', secret).update(`${email}:${purpose}:${code}`).digest();
}

function codeMatches(email, purpose, code, digest) {
  const expected = codeDigest(email, purpose, code);
  const received = Buffer.from(digest, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

async function sendCode({ email, name, purpose, pendingName, pendingRole, pendingPasswordHash }) {
  const recent = await EmailCode.findOne({ email, purpose, createdAt: { $gt: new Date(Date.now() - 60_000) }, consumedAt: null });
  if (recent) {
    const error = new Error('Please wait before requesting another code.');
    error.status = 429;
    throw error;
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const expiresAt = new Date(Date.now() + 10 * 60_000);
  await EmailCode.deleteMany({ email, purpose });
  await EmailCode.create({
    email,
    purpose,
    codeHash: codeDigest(email, purpose, code).toString('hex'),
    expiresAt,
    pendingName,
    pendingRole,
    pendingPasswordHash,
  });

  try {
    await sendEmailCode({ email, name, code, purpose });
  } catch (error) {
    await EmailCode.deleteMany({ email, purpose, consumedAt: null });
    throw error;
  }
}

router.post('/register', codeLimiter, async (request, response) => {
  const name = String(request.body.name || '').trim();
  const email = normalizeEmail(request.body.email);
  const password = request.body.password;
  const role = String(request.body.role || '').toLowerCase();

  if (name.length < 2 || name.length > 120 || !emailPattern.test(email) || !passwordIsValid(password) || !['farmer', 'provider'].includes(role)) {
    return response.status(400).json({ error: 'Enter a valid name, email, password (8–72 characters), and account type.' });
  }
  if (await User.exists({ email })) return response.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });

  const pendingPasswordHash = await bcrypt.hash(password, 12);
  await sendCode({ email, name, purpose: 'sign-up', pendingName: name, pendingRole: role, pendingPasswordHash });
  return response.status(202).json({ message: 'A verification code has been sent to your email.' });
});

router.post('/verify-email', authLimiter, async (request, response) => {
  const email = normalizeEmail(request.body.email);
  const code = String(request.body.code || '').trim();
  if (!emailPattern.test(email) || !/^\d{6}$/.test(code)) return response.status(400).json({ error: 'Enter the email and six-digit code.' });

  const challenge = await EmailCode.findOne({ email, purpose: 'sign-up', consumedAt: null, expiresAt: { $gt: new Date() } }).select('+pendingPasswordHash');
  if (!challenge) return response.status(400).json({ error: 'That code is invalid or has expired. Request a new one.' });
  if (challenge.attempts >= 5) {
    await challenge.deleteOne();
    return response.status(429).json({ error: 'Too many attempts. Request a new code.' });
  }
  if (!codeMatches(email, 'sign-up', code, challenge.codeHash)) {
    challenge.attempts += 1;
    await challenge.save();
    return response.status(400).json({ error: 'That code is incorrect.' });
  }

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      emailVerified: true,
      name: challenge.pendingName,
      role: challenge.pendingRole,
      passwordHash: challenge.pendingPasswordHash,
    });
  }
  await challenge.deleteOne();
  await createSession(user, response);
  return response.status(201).json({ data: { user: publicUser(user) } });
});

router.post('/login', authLimiter, async (request, response) => {
  const email = normalizeEmail(request.body.email);
  const password = request.body.password;
  if (!emailPattern.test(email) || typeof password !== 'string') return response.status(400).json({ error: 'Enter a valid email and password.' });

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return response.status(401).json({ error: 'Email or password is incorrect.' });
  }
  if (!user.emailVerified || user.status !== 'active') return response.status(403).json({ error: 'This account is not available to sign in.' });

  await createSession(user, response);
  return response.json({ data: { user: publicUser(user) } });
});

router.post('/forgot-password', codeLimiter, async (request, response) => {
  const email = normalizeEmail(request.body.email);
  if (!emailPattern.test(email)) return response.status(400).json({ error: 'Enter a valid email address.' });

  const user = await User.findOne({ email, status: 'active' }).select('+passwordHash');
  if (user?.passwordHash) await sendCode({ email, name: user.name, purpose: 'password-reset' });
  return response.json({ message: 'If an account uses that email, a reset code has been sent.' });
});

router.post('/reset-password', authLimiter, async (request, response) => {
  const email = normalizeEmail(request.body.email);
  const code = String(request.body.code || '').trim();
  const password = request.body.password;
  if (!emailPattern.test(email) || !/^\d{6}$/.test(code) || !passwordIsValid(password)) {
    return response.status(400).json({ error: 'Enter the email, six-digit code, and a password of at least 8 characters.' });
  }

  const challenge = await EmailCode.findOne({ email, purpose: 'password-reset', consumedAt: null, expiresAt: { $gt: new Date() } });
  if (!challenge) return response.status(400).json({ error: 'That code is invalid or has expired. Request a new one.' });
  if (challenge.attempts >= 5) {
    await challenge.deleteOne();
    return response.status(429).json({ error: 'Too many attempts. Request a new code.' });
  }
  if (!codeMatches(email, 'password-reset', code, challenge.codeHash)) {
    challenge.attempts += 1;
    await challenge.save();
    return response.status(400).json({ error: 'That code is incorrect.' });
  }

  const user = await User.findOne({ email, status: 'active' });
  if (!user) return response.status(400).json({ error: 'That code is invalid or has expired. Request a new one.' });
  user.passwordHash = await bcrypt.hash(password, 12);
  await user.save();
  await EmailCode.deleteMany({ email, purpose: 'password-reset' });
  return response.json({ message: 'Password updated. You can now sign in.' });
});

router.post('/google', authLimiter, async (request, response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return response.status(503).json({ error: 'Google sign-in is not configured.' });
  const credential = request.body.credential;
  if (typeof credential !== 'string') return response.status(400).json({ error: 'A Google credential is required.' });

  const client = new OAuth2Client(clientId);
  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    return response.status(401).json({ error: 'Google sign-in could not be verified.' });
  }
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    return response.status(401).json({ error: 'Google did not return a verified email address.' });
  }

  const email = normalizeEmail(payload.email);
  let user = await User.findOne({ 'identities.provider': 'google', 'identities.subject': payload.sub });
  let created = false;
  if (!user) {
    user = await User.findOne({ email });
    if (user) {
      user.identities.push({ provider: 'google', subject: payload.sub });
      user.emailVerified = true;
      await user.save();
    } else {
      const role = String(request.body.role || '').toLowerCase();
      if (!['farmer', 'provider'].includes(role)) return response.status(400).json({ error: 'Choose farmer or provider for this account.' });
      user = await User.create({
        email,
        emailVerified: true,
        name: payload.name || email.split('@')[0],
        role,
        identities: [{ provider: 'google', subject: payload.sub }],
        profile: { avatarUrl: payload.picture },
      });
      created = true;
    }
  }
  if (user.status !== 'active') return response.status(403).json({ error: 'This account is not available to sign in.' });

  await createSession(user, response);
  return response.json({ data: { user: publicUser(user), created } });
});

router.get('/me', requireAuth, (request, response) => response.json({ data: { user: publicUser(request.user) } }));
router.patch('/profile', requireAuth, async (request, response) => {
  const allowedFields = ['phone', 'whatsapp', 'businessName', 'primaryArea'];
  const updates = Object.fromEntries(allowedFields
    .filter(field => Object.hasOwn(request.body || {}, field))
    .map(field => [field, String(request.body[field] || '').trim()]));
  if (!Object.keys(updates).length) return response.status(400).json({ error: 'Add at least one profile detail.' });
  const maxLengths = { phone: 32, whatsapp: 32, businessName: 140, primaryArea: 120 };
  if (Object.entries(updates).some(([field, value]) => value.length > maxLengths[field])) return response.status(400).json({ error: 'One or more profile details are too long.' });
  for (const field of ['phone', 'whatsapp']) {
    if (Object.hasOwn(updates, field) && (updates[field].length < 7 || !/^[+\d()\s.-]+$/.test(updates[field]))) {
      return response.status(400).json({ error: `Enter a valid ${field === 'phone' ? 'phone' : 'WhatsApp'} number.` });
    }
  }
  for (const field of ['businessName', 'primaryArea']) {
    if (Object.hasOwn(updates, field) && updates[field].length < 2) {
      return response.status(400).json({ error: `Enter your ${field === 'businessName' ? 'business or fleet name' : 'operating area'}.` });
    }
  }
  for (const [field, value] of Object.entries(updates)) {
    request.user.profile[field] = value;
    if (field === 'phone') request.user.profile.phoneVerified = false;
    if (field === 'whatsapp') request.user.profile.whatsappVerified = false;
  }
  await request.user.save();
  return response.json({ data: { user: publicUser(request.user) } });
});
router.post('/logout', requireAuth, async (request, response) => {
  await destroySession(request, response);
  return response.status(204).end();
});

export default router;
