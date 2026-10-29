import { createHash } from 'node:crypto';
import Session from '../models/Session.js';

export default async function requireAuth(request, response, next) {
  try {
    const token = request.cookies?.hadalink_session;
    if (!token) return response.status(401).json({ error: 'Sign in to continue.' });

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const session = await Session.findOne({ tokenHash, expiresAt: { $gt: new Date() } }).populate('user');
    if (!session || session.user.status !== 'active') {
      return response.status(401).json({ error: 'Your session has expired. Sign in again.' });
    }

    request.user = session.user;
    request.sessionId = session._id;
    return next();
  } catch (error) {
    return next(error);
  }
}
