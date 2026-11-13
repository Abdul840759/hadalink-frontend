import { createHash, randomBytes } from 'node:crypto';
import Session from '../models/Session.js';

const idleTimeoutMs = Math.max(5, Number(process.env.SESSION_IDLE_MINUTES) || 30) * 60_000;
const absoluteLifetimeMs = Math.max(1, Number(process.env.SESSION_MAX_HOURS) || 12) * 60 * 60_000;
const maxSessionsPerUser = Math.min(10, Math.max(1, Number(process.env.SESSION_MAX_PER_USER) || 3));
const cookieName = 'hadalink_session';

export function sessionCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
    path: '/',
    expires: expiresAt,
  };
}

export async function createSession(user, response) {
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  const absoluteExpiresAt = new Date(now.getTime() + absoluteLifetimeMs);
  const expiresAt = new Date(Math.min(now.getTime() + idleTimeoutMs, absoluteExpiresAt.getTime()));
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await Session.create({ user: user._id, tokenHash, lastActivityAt: now, absoluteExpiresAt, expiresAt });

  const overflow = await Session.find({ user: user._id }).sort({ createdAt: -1 }).skip(maxSessionsPerUser).select('_id').lean();
  if (overflow.length) await Session.deleteMany({ _id: { $in: overflow.map(session => session._id) } });
  response.cookie(cookieName, token, sessionCookieOptions(expiresAt));
}

export async function destroySession(request, response) {
  const token = request.cookies?.[cookieName];
  if (token) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await Session.deleteOne({ tokenHash });
  }
  response.clearCookie(cookieName, sessionCookieOptions(new Date(0)));
}

export function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role,
    themePreference: user.themePreference || null,
    hasActionPin: Boolean(user.actionPinSetAt || user.actionPinHash),
    profile: user.profile,
  };
}
