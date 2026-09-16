import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as authApi from '@/api/auth.api.js';
import { loginSchema, loginCredentialsSchema } from '@/lib/validators.js';
import { useAuth } from '@/hooks/useAuth.js';
import { useCountdown } from '@/hooks/useCountdown.js';
import { useGuardedSubmit } from '@/hooks/useGuardedSubmit.js';
import { formatCountdown } from '@/lib/format.js';
import { AuthLayout } from '@/components/layout/AuthLayout.jsx';
import {
  Checkbox,
  Field,
  Input,
  PasswordInput,
  controlBase,
  invalidRing,
} from '@/components/ui/Field.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Alert } from '@/components/ui/Alert.jsx';
import { MailIcon, LockIcon, KeyIcon } from '@/components/ui/FieldIcons.jsx';
import { cn } from '@/lib/cn.js';
import { storeTrustedDevice, tokenForEmail } from '@/lib/trustedDevice.js';

const secondsUntil = (expiresAt) => {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
};

/**
 * Signing in takes two steps: the password earns a code by email, and the code
 * and password together earn the session.
 *
 * The code field is disabled until a code has actually been sent, so the form
 * reads in the order it has to be filled rather than presenting three boxes and
 * leaving the customer to work out which comes first.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [formError, setFormError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const expiry = useCountdown(0);
  const cooldown = useCountdown(0);

  // Where the customer was heading before being asked to sign in.
  const from = location.state?.from ?? '/dashboard';

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '', code: '', rememberDevice: false },
  });

  const isExpired = codeSent && !expiry.isRunning;

  // A browser remembered for this address does not need the code field at all.
  // The server decides; this only spares the customer a box they cannot fill.
  const trustedToken = tokenForEmail(watch('email'));

  /** An unverified account is a step left, not a failed sign-in. */
  const handleUnverified = (error, email) => {
    navigate('/verify-email', {
      replace: true,
      state: { email: error.errors?.email ?? email, resendAfterSeconds: 0 },
    });
  };

  const handleGetCode = async () => {
    setFormError(null);
    setNotice(null);

    // The credentials are checked here on their own, since the code field is
    // still empty at this point and the full schema would reject it.
    const credentials = loginCredentialsSchema.safeParse(getValues());
    if (!credentials.success) {
      for (const issue of credentials.error.issues) {
        setError(issue.path[0], { type: 'manual', message: issue.message });
      }
      return;
    }

    setIsSendingCode(true);

    try {
      const data = await authApi.requestLoginCode(credentials.data);

      setCodeSent(true);
      expiry.restart(secondsUntil(data.expiresAt));
      cooldown.restart(data.resendAfterSeconds ?? 60);
      setNotice(
        data.emailDelivered === false
          ? 'We could not send the code. Please try again in a moment.'
          : `A sign-in code is on its way to ${credentials.data.email}.`,
      );
    } catch (error) {
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        handleUnverified(error, credentials.data.email);
        return;
      }
      setFormError(error.message);
    } finally {
      setIsSendingCode(false);
    }
  };

  const onSubmit = async (values) => {
    setFormError(null);

    // Without a remembered device the code is not optional; say so on the field
    // rather than letting the request come back with a server error.
    if (!trustedToken && !values.code) {
      setError('code', { type: 'manual', message: 'Enter the code we emailed you.' });
      return;
    }

    try {
      const { code, ...credentials } = values;

      const data = await authApi.login({
        ...credentials,
        ...(code ? { code } : {}),
        deviceToken: tokenForEmail(values.email),
      });

      if (data.device?.token) {
        storeTrustedDevice({
          email: values.email,
          token: data.device.token,
          expiresAt: data.device.expiresAt,
        });
      }

      signIn({ token: data.token, user: data.user });
      navigate(from, { replace: true });
    } catch (error) {
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        handleUnverified(error, values.email);
        return;
      }
      setFormError(error.message);
    }
  };

  // Declared after the handler it wraps: `onSubmit` is a const, so calling this
  // any earlier would hit the temporal dead zone.
  const { submit, blockedReasons } = useGuardedSubmit(handleSubmit, onSubmit);

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Access your account, funds and portfolio in one place."
      panelEyebrow="Investor workspace"
      panelTitle="Your portfolio, ready on the web."
      panelText="Sign in to track holdings, market value and gains — with live fund prices in the same workspace."
      altAction={
      <Link
        to="/register"
        className="group flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 transition-colors ring-inset hover:bg-brand-50 hover:ring-brand-200"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <svg
            className="h-[18px] w-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="10" cy="8" r="3.5" />
            <path d="M3.5 20a6.5 6.5 0 0 1 11.2-4.5M18 14v6m3-3h-6" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-slate-500">New to Nivesta?</span>
          <span className="block text-sm font-semibold text-slate-900">Create an account</span>
        </span>
        <svg
          className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      </Link>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {formError && <Alert variant="error">{formError}</Alert>}

        {/* A rule that reports against a field this screen is not showing —
            the code box, once a device is remembered — would otherwise stop the
            form with nothing said. */}
        {blockedReasons.length > 0 && (
          <Alert variant="error" title="Cannot sign in yet">
            <ul className="list-disc space-y-0.5 pl-4">
              {blockedReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </Alert>
        )}
        {notice && !isExpired && <Alert variant="success">{notice}</Alert>}
        {isExpired && (
          <Alert variant="warning" title="That code has expired">
            Ask for a new one to carry on.
          </Alert>
        )}

        <Input
          label="Email address"
          type="email"
          required
          autoComplete="email"
          placeholder="name@example.com"
          icon={<MailIcon />}
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordInput
          label="Password"
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          icon={<LockIcon />}
          error={errors.password?.message}
          // Beside the field it is about, rather than orphaned under the button.
          action={
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              Forgot password?
            </Link>
          }
          {...register('password')}
        />

        {trustedToken ? (
          /* This browser has already been proved on. The code field would only
             be a box the customer cannot fill. */
          <div className="ring-brand-100 bg-brand-50/60 flex items-start gap-3 rounded-xl px-4 py-3 ring-1 ring-inset">
            <span className="bg-brand-100 text-brand-700 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900">
                This device is remembered
              </span>
              <span className="block text-xs text-slate-600">
                No code needed. Your password is still required.
              </span>
            </span>
          </div>
        ) : (
          <>
            <Field
              label="Login code"
              htmlFor="login-code"
              required
              error={errors.code?.message}
              hint={
                codeSent && !isExpired
                  ? `Check your inbox. This code is valid for ${formatCountdown(expiry.remaining)}.`
                  : 'Enter your password, then get a code by email.'
              }
            >
              {/* Side by side once there is room; stacked on a phone, where
                  sharing the row clipped the placeholder and left a button too
                  narrow to aim at. */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <span
                    className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-slate-400"
                    aria-hidden="true"
                  >
                    <KeyIcon />
                  </span>
                  <input
                    id="login-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="6-digit code"
                    disabled={!codeSent || isExpired}
                    aria-invalid={errors.code ? 'true' : undefined}
                    className={cn(
                      controlBase,
                      'tabular h-11 pl-10 tracking-[0.3em]',
                      errors.code && invalidRing,
                    )}
                    {...register('code')}
                  />
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGetCode}
                  loading={isSendingCode}
                  disabled={cooldown.isRunning && !isExpired}
                  className="shrink-0 max-sm:w-full"
                >
                  {codeSent ? 'Resend' : 'Get code'}
                </Button>
              </div>
            </Field>

            {/* Offered only once a code is in play: remembering a browser has to
                be earned by passing the second factor, not by a password alone. */}
            {codeSent && !isExpired && (
              <Checkbox
                label="Remember this device for 7 days, so I do not need a code here again"
                {...register('rememberDevice')}
              />
            )}
          </>
        )}

        {/* Left enabled even before a code has been asked for. A greyed-out
            button that never says why is worse than one that, when pressed,
            points at the field still to be filled. */}
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {isSubmitting ? 'Signing in' : 'Sign in'}
        </Button>

      </form>
    </AuthLayout>
  );
}
