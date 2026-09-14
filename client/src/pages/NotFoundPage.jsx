import { Button } from '@/components/ui/Button.jsx';
import { Logo } from '@/components/layout/Logo.jsx';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-10" />
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        The page you are looking for does not exist or may have moved.
      </p>
      <div className="mt-7">
        <Button to="/dashboard">Back to dashboard</Button>
      </div>
    </div>
  );
}
