import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { RequireAuth, RequireAnonymous } from './guards.jsx';
import { Spinner } from '@/components/ui/Spinner.jsx';

// Routes are code-split so the signed-out screens do not have to download the
// charting and image-cropping libraries that only the signed-in screens use.
const LoginPage = lazy(() => import('@/pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage.jsx'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage.jsx'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage.jsx'));

const DashboardPage = lazy(() => import('@/pages/DashboardPage.jsx'));
const AccountOpeningPage = lazy(() => import('@/pages/account/AccountOpeningPage.jsx'));
const ApplicationSubmittedPage = lazy(() =>
  import('@/pages/account/ApplicationSubmittedPage.jsx'),
);
const ProductsPage = lazy(() => import('@/pages/products/ProductsPage.jsx'));
const ProductDetailPage = lazy(() => import('@/pages/products/ProductDetailPage.jsx'));
const InvestPage = lazy(() => import('@/pages/investments/InvestPage.jsx'));
const InvestmentSuccessPage = lazy(() => import('@/pages/investments/InvestmentSuccessPage.jsx'));
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage.jsx'));
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage.jsx'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'));

function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-brand-700">
      <Spinner size="lg" label="Loading page" />
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<RequireAnonymous />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/account/opening" element={<AccountOpeningPage />} />
            <Route path="/account/submitted" element={<ApplicationSubmittedPage />} />

            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/products/:id/invest" element={<InvestPage />} />

            <Route path="/investments/success" element={<InvestmentSuccessPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
