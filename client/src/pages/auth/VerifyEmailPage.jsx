import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import * as authApi from '@/api/auth.api.js';
import { useAuth } from '@/hooks/useAuth.js';
import { useCountdown } from '@/hooks/useCountdown.js';
import { formatCountdown } from '@/lib/format.js';
import { AuthLayout } from '@/components/layout/AuthLayout.jsx';
import { OtpInput } from '@/components/OtpInput.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Alert } from '@/components/ui/Alert.jsx';

const CODE_LENGTH = 6;

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

  const cooldown = useCountdown(state.resendAfterSeconds ?? 0);

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
        {devOtp && (
          <Alert variant="info" title="Development mode">
            Email delivery is not configured, so the code is shown here instead:{' '}
            <span className="tabular font-bold tracking-widest">{devOtp}</span>
          </Alert>
        )}

        {error && <Alert variant="error">{error}</Alert>}
        {notice && <Alert variant="success">{notice}</Alert>}

        <OtpInput
          value={code}
          onChange={setCode}
          length={CODE_LENGTH}
          disabled={isSubmitting}
          invalid={Boolean(error)}
          autoFocus
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={code.length !== CODE_LENGTH}
        >
          {isSubmitting ? 'Verifying' : 'Verify email'}
        </Button>

        <div className="text-center text-sm text-slate-600">
          {cooldown.isRunning ? (
            <span>
              You can request a new code in{' '}
              <span className="tabular font-semibold text-slate-900">
                {formatCountdown(cooldown.remaining)}
              </span>
            </span>
          ) : (
            <>
              Did not get the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-semibold text-brand-700 hover:text-brand-800 disabled:text-slate-400"
              >
                {isResending ? 'Sending…' : 'Send it again'}
              </button>
            </>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}
