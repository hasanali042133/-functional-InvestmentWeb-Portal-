import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as authApi from '@/api/auth.api.js';
import { loginSchema } from '@/lib/validators.js';
import { useAuth } from '@/hooks/useAuth.js';
import { AuthLayout } from '@/components/layout/AuthLayout.jsx';
import { Input, PasswordInput } from '@/components/ui/Field.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Alert } from '@/components/ui/Alert.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [formError, setFormError] = useState(null);

  // Where the customer was heading before being asked to sign in.
  const from = location.state?.from ?? '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const data = await authApi.login(values);
      signIn({ token: data.token, user: data.user });
      navigate(from, { replace: true });
    } catch (error) {
      // An unverified account is not a failed login — the customer just has a
      // step left, so send them to finish it instead of showing an error.
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-email', {
          replace: true,
          state: { email: error.errors?.email ?? values.email, resendAfterSeconds: 0 },
        });
        return;
      }
      setFormError(error.message);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your account and investments."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError && <Alert variant="error">{formError}</Alert>}

        <Input
          label="Email address"
          type="email"
          required
          autoComplete="email"
          placeholder="Enter your email address"
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordInput
          label="Password"
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {isSubmitting ? 'Signing in' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
