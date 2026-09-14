import { cn } from '@/lib/cn.js';

const TONES = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  brand: 'bg-brand-50 text-brand-800 ring-brand-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-rose-50 text-rose-800 ring-rose-200',
};

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const RISK_TONE = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger' };
const RISK_LABEL = { LOW: 'Low risk', MEDIUM: 'Medium risk', HIGH: 'High risk' };

export function RiskBadge({ level }) {
  return <Badge tone={RISK_TONE[level] ?? 'neutral'}>{RISK_LABEL[level] ?? level}</Badge>;
}

const STATUS_TONE = {
  APPROVED: 'success',
  COMPLETED: 'success',
  SUBMITTED: 'brand',
  PENDING: 'warning',
  DRAFT: 'neutral',
  NOT_STARTED: 'neutral',
  FAILED: 'danger',
};

const STATUS_LABEL = {
  APPROVED: 'Approved',
  COMPLETED: 'Completed',
  SUBMITTED: 'Under review',
  PENDING: 'Pending',
  DRAFT: 'In progress',
  NOT_STARTED: 'Not started',
  FAILED: 'Failed',
};

export function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'}>{STATUS_LABEL[status] ?? status}</Badge>;
}
