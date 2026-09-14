import { cn } from '@/lib/cn.js';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('px-5 py-5', className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return (
    <div className={cn('border-t border-slate-200/80 px-5 py-4', className)}>{children}</div>
  );
}
