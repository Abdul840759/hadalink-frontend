# HadaLink application security

## Authentication protections

- New and reset passwords require at least 12 characters, reject a short list of common passwords, and are limited to bcrypt's 72-byte input maximum. Existing passwords remain valid for sign-in; changing or resetting one applies the new rule.
- Sessions expire after 30 minutes without activity and have a 12-hour absolute lifetime. At most three active sessions are kept per account. Resetting a password revokes every active session.
- Session cookies are HttpOnly, Secure in production, and use the configured SameSite policy. Authenticated write requests require an exact trusted `Origin` from `FRONTEND_ORIGIN`.
- Authentication and email-code routes are rate limited. Request JSON is limited to 1 MB. Helmet and Vercel response headers add browser security protections.
- Cloudflare Turnstile can protect sign-in, registration, email verification, and password-reset flows. The backend verifies each single-use token with Cloudflare and checks its `auth` action and allowed hostname.

## Turnstile setup

Create a Turnstile widget in Cloudflare and allow the exact production hostname (for example, `haddalink.vercel.app`). Set:

- Render: `TURNSTILE_SECRET_KEY` to the widget's secret key.
- Vercel: `VITE_TURNSTILE_SITE_KEY` to the widget's public site key.
- Render: `FRONTEND_ORIGIN` to the exact frontend origin, without a trailing slash. Include additional origins only when they are intentionally trusted.

Set both Turnstile keys before deploying; the backend starts enforcing the challenge when its secret is present. Keep the secret only in Render. Redeploy both services after setting the variables.

## Cloudflare and the current hosting setup

The application is currently served on a `vercel.app` hostname, which HadaLink does not control in DNS. Cloudflare Turnstile works independently and is integrated above. To use a Cloudflare-managed domain, first attach a domain HadaLink owns to the Vercel project. Vercel advises against putting another reverse proxy in front of its edge; if Cloudflare manages that domain, keep its DNS records DNS-only for the Vercel app unless there is a specific, tested reason to proxy them. Cloudflare WAF rules cannot protect the existing `vercel.app` hostname from the Cloudflare edge.

The Render API is still served directly from its Render hostname. To put Cloudflare WAF in front of the API, HadaLink would need an owned API hostname, DNS/origin configuration, and a matching `VITE_API_BASE_URL` plus `FRONTEND_ORIGIN` update. No DNS zone or Cloudflare account credentials are available in this repository, so those account-side changes must be completed in the hosting dashboards.

## Session configuration

Optional Render variables (defaults shown):

- `SESSION_IDLE_MINUTES=30`
- `SESSION_MAX_HOURS=12`
- `SESSION_MAX_PER_USER=3`

Regenerate and store `SESSION_SECRET` and `CODE_HASH_SECRET` as private Render secrets. Never commit credentials or paste them into chat.
