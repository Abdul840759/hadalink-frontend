import { createHash, randomBytes } from 'node:crypto';
import Session from '../models/Session.js';

const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 30;
const cookieName = 'hadalink_session';

export async function createSession(user, response) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await Session.create({ user: user._id, tokenHash, expiresAt });

  response.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession(request, response) {
  const token = request.cookies?.[cookieName];
  if (token) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await Session.deleteOne({ tokenHash });
  }
  response.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
    path: '/',
  });
}

export function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role,
    profile: user.profile,
  };
}
