import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

/**
 * Email delivery over SMTP.
 *
 * Gmail is just an SMTP host, and unlike a shared provider sandbox it delivers
 * to any address without owning a verified domain — which is the whole reason
 * it is used here.
 *
 * With no credentials the message is logged instead of sent, so local
 * development needs no external account at all.
 */

const configured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

// Implicit TLS on 465, STARTTLS on anything else. Gmail accepts both; 587 is the
// port it documents.
const transporter = configured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null;

// Gmail rewrites a From that does not belong to the authenticated account, so
// the sending address defaults to the account itself rather than to something
// that would silently be replaced.
const from = env.EMAIL_FROM || env.SMTP_USER;

export const emailTransport = configured ? 'smtp' : 'console';

// Reported at boot, so a misconfigured deploy is visible immediately rather
// than at the first signup.
console.info(
  configured
    ? `[email] sending over SMTP via ${env.SMTP_HOST}:${env.SMTP_PORT} as ${from}`
    : '[email] SMTP is not configured, verification codes will be logged to the console',
);

const logToConsole = ({ to, subject, text, preview }) => {
  console.info(
    `\n──────── EMAIL (not sent — SMTP is not configured) ────────\n` +
      `To:      ${to}\n` +
      `Subject: ${subject}\n` +
      `${preview ?? text}\n` +
      `───────────────────────────────────────────────────────────\n`,
  );
  return { delivered: false, reason: 'NO_TRANSPORT' };
};

const deliver = async ({ to, subject, html, text, preview }) => {
  if (!transporter) return logToConsole({ to, subject, text, preview });

  try {
    await transporter.sendMail({ from, to, subject, html, text });
    return { delivered: true };
  } catch (error) {
    // A failed send must not fail the request: the customer can ask for another
    // code, and the screen already tells them the email did not go out.
    console.error('[email] delivery failed', error?.message ?? error);
    return { delivered: false, reason: error?.message ?? 'SEND_FAILED' };
  }
};

// "expires in 1 minutes" reads like a bug in a customer-facing email.
// "expires in 1 minutes" reads like a bug in a customer-facing email.
const minutesLabel = (minutes) => `${minutes} minute${minutes === 1 ? '' : 's'}`;

/**
 * One layout for every code we send.
 *
 * Only the heading, the sentence above the code and the closing reassurance
 * change between them — and that closing line is the one that matters most,
 * because it is what tells somebody whose account is being probed that
 * something is wrong.
 */
const codeTemplate = ({ heading, intro, code, expiryMinutes, footnote }) => `
<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <h1 style="margin:0 0 8px;font-size:20px;">${heading}</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#4b5563;">${intro}</p>
                <div style="text-align:center;background:#f4f5f7;border-radius:10px;padding:20px;margin-bottom:24px;">
                  <span style="font-size:32px;font-weight:700;letter-spacing:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${code}</span>
                </div>
                <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#4b5563;">
                  This code expires in ${minutesLabel(expiryMinutes)}.
                </p>
                <p style="margin:0;font-size:13px;line-height:20px;color:#6b7280;">${footnote}</p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">Nivesta</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const sendCode = ({ to, name, code, expiryMinutes, subject, heading, intro, footnote, summary }) =>
  deliver({
    to,
    subject,
    html: codeTemplate({ heading, intro, code, expiryMinutes, footnote }),
    text: `Hi ${name}, ${summary} ${code}. It expires in ${minutesLabel(expiryMinutes)}.`,
    preview: `${subject}  (expires in ${minutesLabel(expiryMinutes)})`,
  });

/** Signup: proves the address belongs to whoever entered it. */
export const sendOtpEmail = ({ to, name, code, expiryMinutes }) =>
  sendCode({
    to,
    name,
    code,
    expiryMinutes,
    subject: `${code} is your verification code`,
    heading: 'Verify your email address',
    intro: `Hi ${name}, use the code below to finish setting up your Nivesta account.`,
    footnote: 'If you did not create this account, you can safely ignore this email.',
    summary: 'your Nivesta verification code is',
  });

/** Sign-in: the second factor, after the password has already been checked. */
export const sendLoginCodeEmail = ({ to, name, code, expiryMinutes }) =>
  sendCode({
    to,
    name,
    code,
    expiryMinutes,
    subject: `${code} is your sign-in code`,
    heading: 'Sign in to your account',
    intro: `Hi ${name}, use the code below to finish signing in.`,
    // Somebody who gets this without asking has had their password entered
    // correctly by someone else, which is worth saying outright.
    footnote:
      'If you did not try to sign in, someone else may know your password. Change it as soon as you can.',
    summary: 'your Nivesta sign-in code is',
  });

/** Password reset: the code that authorises choosing a new password. */
export const sendPasswordResetEmail = ({ to, name, code, expiryMinutes }) =>
  sendCode({
    to,
    name,
    code,
    expiryMinutes,
    subject: `${code} is your password reset code`,
    heading: 'Reset your password',
    intro: `Hi ${name}, use the code below to choose a new password.`,
    footnote:
      'If you did not ask to reset your password, you can ignore this email and your password will stay as it is.',
    summary: 'your Nivesta password reset code is',
  });
