const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export async function sendEmailCode({ email, name, code, purpose }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    const error = new Error('Email delivery is not configured.');
    error.status = 503;
    throw error;
  }

  const reset = purpose === 'password-reset';
  const actionPin = purpose === 'action-pin';
  const subject = reset ? 'Reset your HadaLink password' : actionPin ? 'Verify your HadaLink action PIN' : 'Verify your HadaLink email';
  const frontendOrigins = (process.env.FRONTEND_ORIGIN || 'https://haddalink.vercel.app')
    .split(',').map(value => value.trim()).filter(Boolean);
  const frontendOrigin = frontendOrigins.find(value => value.startsWith('https://')) || frontendOrigins[0];
  let logoUrl = '';
  try {
    const parsedOrigin = new URL(frontendOrigin);
    if (['https:', 'http:'].includes(parsedOrigin.protocol)) logoUrl = new URL('/hadalink-mark.png', parsedOrigin).toString();
  } catch {
    // The email remains complete if the frontend origin is not configured as a URL.
  }
  const preheader = reset ? 'Your secure HadaLink password reset code.' : actionPin ? 'Confirm this change to your HadaLink action PIN.' : 'One quick step to finish setting up your HadaLink account.';
  const heading = reset ? 'Reset your password' : actionPin ? 'Confirm your action PIN' : 'Verify your email';
  const intro = reset
    ? 'Enter this secure code on HadaLink to choose a new password.'
    : actionPin
      ? 'Enter this one-time code in Settings to securely create or change your role action PIN.'
      : 'Enter this secure code on HadaLink to verify your email and finish creating your account.';
  const logo = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" width="42" height="42" alt="HadaLink" style="display:block;width:42px;height:42px;border:0;border-radius:12px">`
    : '<span style="display:inline-block;color:#f8fbf7;font-size:20px;font-weight:700;line-height:42px">H</span>';
  const htmlContent = `<!doctype html><html><body style="margin:0;padding:0;background:#f2f5f1;font-family:Arial,Helvetica,sans-serif;color:#193326"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f2f5f1"><tr><td align="center" style="padding:36px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #dce6dd;border-radius:18px;overflow:hidden"><tr><td style="padding:24px 30px;background:#102b1d;border-bottom:4px solid #e5a629"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding-right:12px;vertical-align:middle">${logo}</td><td style="vertical-align:middle;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-.4px">HadaLink<span style="display:block;margin-top:4px;color:#b9c9bc;font-size:9px;font-weight:600;letter-spacing:1.5px">LOCAL AGRICULTURAL EQUIPMENT</span></td></tr></table></td></tr><tr><td style="padding:34px 30px 12px"><p style="margin:0 0 10px;color:#9a711b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">ACCOUNT SECURITY</p><h1 style="margin:0;color:#193326;font-size:26px;line-height:1.25;letter-spacing:-.6px">${heading}</h1><p style="margin:18px 0 0;color:#53665a;font-size:15px;line-height:1.7">Hello ${escapeHtml(name || 'there')},</p><p style="margin:8px 0 0;color:#53665a;font-size:14px;line-height:1.7">${intro}</p></td></tr><tr><td style="padding:22px 30px 10px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f8f4;border:1px solid #dce6dd;border-radius:12px"><tr><td align="center" style="padding:21px 16px 8px;color:#738378;font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">YOUR ONE-TIME CODE</td></tr><tr><td align="center" style="padding:8px 16px 20px"><span style="display:inline-block;color:#173b28;font-family:Arial,Helvetica,sans-serif;font-size:32px;font-weight:700;letter-spacing:9px;line-height:1.3;user-select:all">${escapeHtml(code)}</span></td></tr></table></td></tr><tr><td style="padding:8px 30px 30px"><p style="margin:0;color:#53665a;font-size:13px;line-height:1.7"><strong style="color:#193326">Copy the code</strong> and paste it into the HadaLink verification screen.</p><p style="margin:14px 0 0;color:#718076;font-size:12px;line-height:1.7">This code expires in <strong>10 minutes</strong> and can only be used once. If you did not request it, you can safely ignore this email.</p></td></tr><tr><td style="padding:18px 30px;border-top:1px solid #e5ebe5;background:#fafbf9"><p style="margin:0;color:#718076;font-size:11px;line-height:1.7">HadaLink · Supporting local agriculture across Plateau State, Nigeria</p><p style="margin:5px 0 0;color:#98a49a;font-size:10px;line-height:1.6">This is an automated account security message. Please do not reply.</p></td></tr></table></td></tr></table></body></html>`;

  let result;
  try {
    result = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: senderEmail, name: 'HadaLink' },
        to: [{ email }],
        subject,
        htmlContent,
        textContent: `${heading}\n\nHello ${name || 'there'},\n\n${intro}\n\nYour one-time code: ${code}\n\nCopy this code and paste it into the HadaLink verification screen. It expires in 10 minutes and can only be used once. If you did not request it, ignore this email.`,
        tags: ['hadalink-auth-code'],
      }),
    });
  } catch (cause) {
    console.error('[email] Brevo request failed before receiving a response:', cause?.name || 'NetworkError');
    const error = new Error('Could not send the verification email.');
    error.status = 502;
    throw error;
  }

  if (!result.ok) {
    let responseDetails = {};
    try {
      const body = await result.json();
      responseDetails = {
        code: typeof body?.code === 'string' ? body.code : undefined,
        message: typeof body?.message === 'string'
          ? body.message.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[redacted email]').slice(0, 400)
          : undefined,
      };
    } catch {
      // Keep the client response generic if Brevo returns an unreadable response.
    }
    console.error(`[email] Brevo rejected verification email (HTTP ${result.status}): ${JSON.stringify(responseDetails)}`);
    const error = new Error('Could not send the verification email.');
    error.status = 502;
    throw error;
  }
}
