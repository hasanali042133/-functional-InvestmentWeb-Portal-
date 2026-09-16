import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as authApi from '@/api/auth.api.js';
import { registerSchema, passwordChecks } from '@/lib/validators.js';
import { AuthLayout } from '@/components/layout/AuthLayout.jsx';
import { Input, PasswordInput } from '@/components/ui/Field.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Alert } from '@/components/ui/Alert.jsx';
import { MailIcon, LockIcon, UserIcon } from '@/components/ui/FieldIcons.jsx';
import { cn } from '@/lib/cn.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const password = watch('password');
  const checks = passwordChecks(password);

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const data = await authApi.register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });

      // The verification screen needs to know which address to verify. It is
      // passed through navigation state rather than the URL so the address is
      // not left sitting in the browser history.
      navigate('/verify-email', {
        replace: true,
        state: {
          email: data.verification.email,
          expiresAt: data.verification.expiresAt,
          resendAfterSeconds: data.verification.resendAfterSeconds,
          devOtp: data.verification.devOtp,
          emailDelivered: data.verification.emailDelivered,
        },
      });
    } catch (error) {
      // Map field-level errors from the backend onto the form itself.
      const fieldErrors = error.fieldErrors ?? {};
      const mapped = Object.entries(fieldErrors);
      mapped.forEach(([field, message]) => setError(field, { type: 'server', message }));

      if (error.code === 'EMAIL_ALREADY_REGISTERED') {
        setError('email', { type: 'server', message: error.message });
        return;
      }

      if (mapped.length === 0) setFormError(error.message);
    }
  };

  return (
    <AuthLayout
      title="Create your free account"
      subtitle="Start with your details. We will email you a code to verify your address."
      panelEyebrow="Free account"
      panelTitle="Everything you need to invest."
      panelText="Open an account online, choose a fund that matches your risk appetite, and follow its value from the same workspace."
      altAction={
        <Link
          to="/login"
          className="group hover:bg-brand-50 hover:ring-brand-200 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 transition-colors ring-inset"
        >
          <span className="bg-brand-100 text-brand-700 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
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
              <path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-slate-500">Already have an account?</span>
            <span className="block text-sm font-semibold text-slate-900">Log in to Nivesta</span>
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
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError && <Alert variant="error">{formError}</Alert>}

        <Input
          label="Full name"
          required
          autoComplete="name"
          placeholder="Enter your full name"
          icon={<UserIcon />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Email address"
          type="email"
          required
          autoComplete="username"
          placeholder="name@example.com"
          icon={<MailIcon />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <PasswordInput
            label="Password"
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
          icon={<LockIcon />}
            error={errors.password?.message}
            {...register('password')}
          />
          {password && !errors.password && (
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {checks.map((check) => (
                <li
                  key={check.label}
                  className={cn(
                    'flex items-center gap-1.5 text-xs',
                    check.met ? 'text-emerald-700' : 'text-slate-500',
                  )}
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {check.met ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <circle cx="12" cy="12" r="8" />}
                  </svg>
                  {check.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <PasswordInput
          label="Confirm password"
          required
          autoComplete="new-password"
          placeholder="Re-enter your password"
          icon={<LockIcon />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {isSubmitting ? 'Creating account' : 'Create account'}
        </Button>

        <p className="text-center text-xs leading-relaxed text-slate-500">
          By continuing you agree to our terms of service and privacy policy.
        </p>
      </form>
    </AuthLayout>
  );
}
