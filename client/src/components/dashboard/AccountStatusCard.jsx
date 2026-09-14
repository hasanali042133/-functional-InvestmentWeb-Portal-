import { Card, CardBody, CardHeader } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import { cn } from '@/lib/cn.js';

const STEP_LABELS = [
  'Verify your email',
  'Complete your account opening application',
  'Upload your identity documents',
  'Start investing',
];

/** How far through onboarding the customer is, from their application status. */
const completedStepsFor = (status) => {
  if (status === 'APPROVED') return 4;
  if (status === 'SUBMITTED') return 3;
  if (status === 'DRAFT') return 1;
  return 1; // email verified, nothing started
};

export function AccountStatusCard({ status }) {
  const completed = completedStepsFor(status);
  const percent = Math.round((completed / STEP_LABELS.length) * 100);
  const isApproved = status === 'APPROVED';

  if (isApproved) {
    return (
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4 bg-emerald-50/60">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-slate-900">Your account has been approved</p>
              <p className="mt-0.5 text-sm text-slate-600">You can now start investing.</p>
            </div>
          </div>
          <Button to="/products">Invest now</Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Getting started"
        description={`${completed} of ${STEP_LABELS.length} steps complete`}
        action={<StatusBadge status={status ?? 'NOT_STARTED'} />}
      />
      <CardBody>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Account opening progress"
        >
          <div
            className="h-full rounded-full bg-accent-500 transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <ol className="mt-5 space-y-3.5">
          {STEP_LABELS.map((label, index) => {
            const done = index < completed;
            return (
              <li key={label} className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {done ? (
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className={done ? 'text-sm text-slate-400 line-through' : 'text-sm text-slate-700'}>
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

        <Button size="lg" fullWidth className="mt-6" to="/account/opening">
          {status === 'DRAFT' ? 'Continue account opening' : 'Complete account opening'}
        </Button>
      </CardBody>
    </Card>
  );
}
