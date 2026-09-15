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
      title="Create your account"
      subtitle="Start with your details. We will email you a code to verify your address."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError && <Alert variant="error">{formError}</Alert>}

        <Input
          label="Full name"
          required
          autoComplete="name"
          placeholder="Enter your full name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Email address"
          type="email"
          required
          autoComplete="email"
          placeholder="Enter your email address"
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <PasswordInput
            label="Password"
            required
            autoComplete="new-password"
            placeholder="Enter a password"
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
