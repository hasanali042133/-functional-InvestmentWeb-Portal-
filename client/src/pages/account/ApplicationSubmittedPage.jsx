import { useLocation } from 'react-router-dom';
import { Card, CardBody } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { formatDateTime } from '@/lib/format.js';

export default function ApplicationSubmittedPage() {
  const { state } = useLocation();

  return (
    <div className="mx-auto max-w-lg py-6">
      <Card>
        <CardBody className="px-6 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-8 w-8 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Your account has been approved
          </h1>
          <p className="mt-2 text-slate-600">You can now start investing.</p>

          {state?.approvedAt && (
            <p className="mt-4 text-sm text-slate-500">
              Approved on {formatDateTime(state.approvedAt)}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" to="/products">
              Invest now
            </Button>
            <Button size="lg" variant="secondary" to="/dashboard">
              Go to dashboard
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
