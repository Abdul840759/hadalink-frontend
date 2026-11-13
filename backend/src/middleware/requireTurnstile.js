import { siteAccessTokenIsValid } from './siteAccess.js';

const trustedHostnames = () => new Set(
  (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map(origin => { try { return new URL(origin.trim()).hostname; } catch { return ''; } })
    .filter(Boolean),
);

export default async function requireTurnstile(request, response, next) {
  if (siteAccessTokenIsValid(request.get('x-hadalink-site-access'))) return next();
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return next();

  const token = String(request.body?.turnstileToken || '').trim();
  if (!token || token.length > 2048) {
    return response.status(400).json({ error: 'Complete the security check and try again.' });
  }

  try {
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(5_000),
    });
    const result = await verification.json();
    const allowedHosts = trustedHostnames();
    if (!verification.ok || result.success !== true || result.action !== 'auth' || !allowedHosts.has(result.hostname)) {
      return response.status(400).json({ error: 'The security check expired or could not be verified. Please try again.' });
    }
    return next();
  } catch (error) {
    console.error('[turnstile] Verification service unavailable:', error.message);
    return response.status(503).json({ error: 'The security check is temporarily unavailable. Please try again.' });
  }
}
