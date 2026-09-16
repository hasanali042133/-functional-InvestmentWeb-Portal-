import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import * as authApi from '@/api/auth.api.js';
import { useAuth } from '@/hooks/useAuth.js';
import { useCountdown } from '@/hooks/useCountdown.js';
import { formatCountdown } from '@/lib/format.js';
import { AuthLayout } from '@/components/layout/AuthLayout.jsx';
import { OtpInput } from '@/components/OtpInput.jsx';
import { CountdownRing } from '@/components/CountdownRing.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Alert } from '@/components/ui/Alert.jsx';

const CODE_LENGTH = 6;

/** Seconds left on a deadline the server issued, never below zero. */
const secondsUntil = (expiresAt) => {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
};

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const state = location.state ?? {};
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [devOtp, setDevOtp] = useState(state.devOtp ?? null);
  // The backend reports whether the email actually went out. Showing the code
  // on screen and telling the customer email is not configured are two separate
  // facts, and conflating them means the screen can state something untrue.
  const [emailDelivered, setEmailDelivered] = useState(state.emailDelivered ?? null);

  // The code's own lifetime, counted against the deadline the server issued
  // rather than a duration started on the client, so a slow page load cannot
  // leave the ring showing time the code no longer has.
  const [lifetime, setLifetime] = useState(() => secondsUntil(state.expiresAt));
  const expiry = useCountdown(secondsUntil(state.expiresAt));
  const cooldown = useCountdown(state.resendAfterSeconds ?? 0);

  const isExpired = Boolean(state.expiresAt) && !expiry.isRunning;

  // Clear the error as soon as the customer starts correcting the code.
  useEffect(() => {
    if (code.length < CODE_LENGTH) setError(null);
  }, [code]);

  // Reached directly with no email to verify — nothing sensible to show.
  if (!state.email) return <Navigate to="/register" replace />;

  const submit = async (submittedCode) => {
    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const data = await authApi.verifyOtp({ email: state.email, code: submittedCode });
      signIn({ token: data.token, user: data.user });
      navigate('/dashboard', { replace: true });
    } catch (caught) {
      setError(caught.message);
      setCode('');
      if (caught.code === 'ALREADY_VERIFIED') {
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (code.length !== CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code from your email.`);
      return;
    }
    submit(code);
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setNotice(null);

    try {
      const data = await authApi.resendOtp({ email: state.email });
      setCode('');
      setDevOtp(data.devOtp ?? null);
      setEmailDelivered(data.emailDelivered ?? null);

      const fresh = secondsUntil(data.expiresAt);
      setLifetime(fresh);
      expiry.restart(fresh);
      cooldown.restart(data.resendAfterSeconds ?? 60);
      setNotice('A new code is on its way.');
    } catch (caught) {
      if (caught.code === 'OTP_COOLDOWN') {
        cooldown.restart(caught.errors?.retryAfterSeconds ?? 60);
      }
      setError(caught.message);
    } finally {
      setIsResending(false);
    }
  };

  const resendButton = (
    <button
      type="button"
      onClick={handleResend}
      disabled={isResending || cooldown.isRunning}
      className="font-semibold text-brand-700 hover:text-brand-800 disabled:text-slate-400"
    >
      {isResending ? 'Sending…' : 'Resend now'}
    </button>
  );

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        <>
          We sent a {CODE_LENGTH}-digit code to{' '}
          <span className="font-semibold text-slate-900">{state.email}</span>.
        </>
      }
      footer={
        <>
          Wrong address?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
            Start over
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {devOtp && !isExpired && (
          <Alert
            variant={emailDelivered === false ? 'warning' : 'info'}
            title={emailDelivered === false ? 'Email could not be delivered' : 'Development mode'}
          >
            {emailDelivered === false
              ? 'The email did not go out, so use the code shown here: '
              : 'The email is on its way. The code is also shown here while the app runs in development: '}
            <span className="tabular font-bold tracking-widest">{devOtp}</span>
          </Alert>
        )}

        {/* Delivery failed and there is no code to fall back on, which is the
            one case where the customer is genuinely stuck. */}
        {!devOtp && emailDelivered === false && !isExpired && (
          <Alert variant="warning" title="Email could not be delivered">
            We could not send the code to {state.email}. Try again in a moment, or use a different
            address.
          </Alert>
        )}

        {isExpired && (
          <Alert variant="warning" title="That code has expired">
            Codes are only valid for a short time. Request a new one to carry on.
          </Alert>
        )}

        {error && <Alert variant="error">{error}</Alert>}
        {notice && <Alert variant="success">{notice}</Alert>}

        {/* The ring sits beside the code it belongs to, so the time left reads
            as a property of the code rather than of the page. */}
        {Boolean(state.expiresAt) && (
          <div className="flex items-center gap-4 rounded-lg bg-slate-50 px-4 py-3 ring-1 ring-slate-200 ring-inset">
            <CountdownRing remaining={expiry.remaining} total={lifetime} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {isExpired ? 'Code expired' : 'Code expires soon'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {isExpired
                  ? 'Request a new code to try again.'
                  : `Valid for ${formatCountdown(expiry.remaining)} more.`}
              </p>
            </div>
          </div>
        )}

        <OtpInput
          value={code}
          onChange={setCode}
          length={CODE_LENGTH}
          disabled={isSubmitting || isExpired}
          invalid={Boolean(error)}
          autoFocus
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={code.length !== CODE_LENGTH || isExpired}
        >
          {isSubmitting ? 'Verifying' : 'Verify email'}
        </Button>

        {/*
          One countdown, not two. The ring above already carries the number, and
          the cooldown runs for exactly as long as the code lives, so a second
          clock underneath only gave the customer two figures to reconcile.
        */}
        <div className="text-center text-sm text-slate-600">
          {cooldown.isRunning ? (
            <span>You can ask for a new code once this one expires.</span>
          ) : (
            <>
              {isExpired ? 'Need another code?' : 'Did not get the code?'} {resendButton}
            </>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}
