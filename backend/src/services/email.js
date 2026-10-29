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
  const subject = reset ? 'Reset your HadaLink password' : 'Verify your HadaLink email';
  const intro = reset ? 'Use this code to reset your password.' : 'Use this code to verify your email and finish creating your account.';
  const htmlContent = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#183326"><h1>HadaLink</h1><p>Hello ${escapeHtml(name || 'there')},</p><p>${intro}</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`;

  const result = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: senderEmail, name: 'HadaLink' },
      to: [{ email }],
      subject,
      htmlContent,
      textContent: `HadaLink verification code: ${code}. It expires in 10 minutes.`,
      tags: ['hadalink-auth-code'],
    }),
  });

  if (!result.ok) {
    const error = new Error('Could not send the verification email.');
    error.status = 502;
    throw error;
  }
}
