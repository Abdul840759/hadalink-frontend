import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const ACCESS_TOKEN_LIFETIME_MS = 8 * 60 * 60 * 1000;

function accessSecret() {
  return process.env.SESSION_SECRET || process.env.TURNSTILE_SECRET_KEY || '';
}

function signature(payload) {
  const secret = accessSecret();
  return secret ? createHmac('sha256', secret).update(payload).digest('base64url') : '';
}

export function issueSiteAccessToken() {
  const expiresAt = Date.now() + ACCESS_TOKEN_LIFETIME_MS;
  const payload = `${expiresAt}.${randomBytes(18).toString('base64url')}`;
  return `${payload}.${signature(payload)}`;
}

export function siteAccessTokenIsValid(token) {
  if (typeof token !== 'string' || token.length > 256) return false;
  const [expiresAt, nonce, suppliedSignature, extra] = token.split('.');
  if (extra !== undefined || !/^\d{13}$/.test(expiresAt || '') || !/^[A-Za-z0-9_-]{20,30}$/.test(nonce || '')) return false;
  if (Number(expiresAt) <= Date.now()) return false;
  const expected = Buffer.from(signature(`${expiresAt}.${nonce}`));
  const received = Buffer.from(suppliedSignature || '');
  return expected.length > 0 && expected.length === received.length && timingSafeEqual(expected, received);
}

export default function requireSiteAccess(request, response, next) {
  // Express mounts this middleware at /api, so request.path is the path *within*
  // that mount (e.g. /health/). Accept the trailing slash used by Render's probe.
  if (/^\/health\/?$/.test(request.path) || request.path === '/auth/site-access/verify') return next();
  if (process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(request.hostname)) return next();
  const token = request.get('x-hadalink-site-access');
  if (!siteAccessTokenIsValid(token)) {
    return response.status(403).json({ error: 'Verify that you are human to continue.' });
  }
  return next();
}
