import { createHash } from 'node:crypto';
import Session from '../models/Session.js';
import { sessionCookieOptions } from '../services/sessions.js';

const idleTimeoutMs = Math.max(5, Number(process.env.SESSION_IDLE_MINUTES) || 30) * 60_000;
const activityWriteIntervalMs = 60_000;
const trustedOrigins = new Set((process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map(origin => origin.trim()).filter(Boolean));

export default async function requireAuth(request, response, next) {
  try {
    const token = request.cookies?.hadalink_session;
    if (!token) return response.status(401).json({ error: 'Sign in to continue.' });

    const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    const origin = request.get('origin');
    if (isWrite && (!origin || !trustedOrigins.has(origin))) {
      return response.status(403).json({ error: 'This request could not be verified. Refresh the page and try again.' });
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const session = await Session.findOne({ tokenHash, expiresAt: { $gt: new Date() } }).populate('user');
    if (!session || session.user.status !== 'active') {
      if (session) await session.deleteOne();
      response.clearCookie('hadalink_session', sessionCookieOptions(new Date(0)));
      return response.status(401).json({ error: 'Your session has expired. Sign in again.' });
    }

    const now = Date.now();
    const absoluteExpiresAt = session.absoluteExpiresAt || new Date(session.createdAt.getTime() + 12 * 60 * 60_000);
    const lastActivityAt = session.lastActivityAt || session.createdAt;
    if (absoluteExpiresAt.getTime() <= now || lastActivityAt.getTime() + idleTimeoutMs <= now) {
      await session.deleteOne();
      response.clearCookie('hadalink_session', sessionCookieOptions(new Date(0)));
      return response.status(401).json({ error: 'Your session expired after inactivity. Sign in again.' });
    }

    if (now - lastActivityAt.getTime() >= activityWriteIntervalMs || !session.absoluteExpiresAt) {
      session.lastActivityAt = new Date(now);
      session.absoluteExpiresAt = absoluteExpiresAt;
      session.expiresAt = new Date(Math.min(now + idleTimeoutMs, absoluteExpiresAt.getTime()));
      await session.save();
    }
    response.cookie('hadalink_session', token, sessionCookieOptions(session.expiresAt));

    request.user = session.user;
    request.sessionId = session._id;
    return next();
  } catch (error) {
    return next(error);
  }
}
