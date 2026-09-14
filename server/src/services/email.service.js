import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Without a RESEND_API_KEY the service falls back to logging the message.
 * That keeps local development working with no external account, and makes a
 * misconfigured production deploy obvious in the logs rather than silent.
 */
const deliver = async ({ to, subject, html, text, preview }) => {
  if (!resend) {
    console.info(
      `\n──────── EMAIL (not sent — RESEND_API_KEY is not set) ────────\n` +
        `To:      ${to}\n` +
        `Subject: ${subject}\n` +
        `${preview ?? text}\n` +
        `─────────────────────────────────────────────────────────────\n`,
    );
    return { delivered: false, reason: 'NO_API_KEY' };
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    // A failed email must not fail the whole request — the user can always ask
    // for a new code — but it does need to be visible to us.
    console.error('[email] delivery failed', error);
    return { delivered: false, reason: error.message ?? 'SEND_FAILED' };
  }

  return { delivered: true };
};

const otpTemplate = ({ name, code, expiryMinutes }) => `
<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <h1 style="margin:0 0 8px;font-size:20px;">Verify your email address</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#4b5563;">
                  Hi ${name}, use the code below to finish setting up your Investment Portal account.
                </p>
                <div style="text-align:center;background:#f4f5f7;border-radius:10px;padding:20px;margin-bottom:24px;">
                  <span style="font-size:32px;font-weight:700;letter-spacing:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${code}</span>
                </div>
                <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#4b5563;">
                  This code expires in ${expiryMinutes} minutes.
                </p>
                <p style="margin:0;font-size:13px;line-height:20px;color:#6b7280;">
                  If you did not create this account, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">Investment Portal</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const sendOtpEmail = ({ to, name, code, expiryMinutes }) =>
  deliver({
    to,
    subject: `${code} is your verification code`,
    html: otpTemplate({ name, code, expiryMinutes }),
    text: `Hi ${name}, your Investment Portal verification code is ${code}. It expires in ${expiryMinutes} minutes.`,
    preview: `Verification code: ${code}  (expires in ${expiryMinutes} minutes)`,
  });
