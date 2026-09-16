import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as authApi from '@/api/auth.api.js';
import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/validators.js';
import { useAuth } from '@/hooks/useAuth.js';
import { useCountdown } from '@/hooks/useCountdown.js';
import { formatCountdown } from '@/lib/format.js';
import { AuthLayout } from '@/components/layout/AuthLayout.jsx';
import { Input, PasswordInput } from '@/components/ui/Field.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Alert } from '@/components/ui/Alert.jsx';
import { MailIcon, LockIcon, KeyIcon } from '@/components/ui/FieldIcons.jsx';

const secondsUntil = (expiresAt) => {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
};

/** Step one: ask where to send the code. */
function RequestStep({ onSent }) {
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const data = await authApi.forgotPassword(values);
      onSent({ email: values.email, ...data });
    } catch (error) {
      setFormError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError && <Alert variant="error">{formError}</Alert>}

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

      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        {isSubmitting ? 'Sending' : 'Send reset code'}
      </Button>
    </form>
  );
}

/** Step two: the code from the email, and the password to replace the old one. */
function ResetStep({ sent, onResend }) {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [formError, setFormError] = useState(null);

  const expiry = useCountdown(secondsUntil(sent.expiresAt));
  const isExpired = Boolean(sent.expiresAt) && !expiry.isRunning;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: { code: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const data = await authApi.resetPassword({
        email: sent.email,
        code: values.code,
        password: values.password,
      });

      // The reset proves the customer holds the inbox, which is the same proof
      // signing in asks for — so there is nothing left to ask them for.
      signIn({ token: data.token, user: data.user });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError && <Alert variant="error">{formError}</Alert>}

      {isExpired ? (
        <Alert variant="warning" title="That code has expired">
          Ask for a new one to carry on.
        </Alert>
      ) : (
        <Alert variant="info">
          If <span className="font-semibold">{sent.email}</span> has an account, a code is on its
          way.{' '}
          {Boolean(sent.expiresAt) && (
            <>
              It is valid for{' '}
              <span className="tabular font-semibold">{formatCountdown(expiry.remaining)}</span>.
            </>
          )}
        </Alert>
      )}

      <Input
        label="Reset code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        placeholder="6-digit code"
        icon={<KeyIcon />}
        disabled={isExpired}
        error={errors.code?.message}
        className="tabular tracking-[0.3em]"
        {...register('code')}
      />

      <PasswordInput
        label="New password"
        required
        autoComplete="new-password"
        placeholder="At least 8 characters"
        icon={<LockIcon />}
        disabled={isExpired}
        error={errors.password?.message}
        {...register('password')}
      />

      <PasswordInput
        label="Confirm new password"
        required
        autoComplete="new-password"
        placeholder="Re-enter your new password"
        icon={<LockIcon />}
        disabled={isExpired}
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={isExpired}>
        {isSubmitting ? 'Saving' : 'Set new password'}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Did not get the code?{' '}
        <button
          type="button"
          onClick={onResend}
          className="font-semibold text-brand-700 hover:text-brand-800"
        >
          Start again
        </button>
      </p>
    </form>
  );
}

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(null);

  return (
    <AuthLayout
      title={sent ? 'Choose a new password' : 'Forgot your password?'}
      subtitle={
        sent
          ? 'Enter the code from your email and pick a new password.'
          : 'Enter your email address and we will send you a code to reset it.'
      }
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <ResetStep sent={sent} onResend={() => setSent(null)} />
      ) : (
        <RequestStep onSent={setSent} />
      )}
    </AuthLayout>
  );
}
