/**
 * A stylised look at the signed-in app, shown beside the auth forms.
 *
 * Drawn rather than screenshotted: a real capture goes stale the moment the
 * dashboard changes, and would have to carry somebody's actual figures. The
 * numbers here are obviously illustrative and the layout mirrors the real one.
 */

const HOLDINGS = [
  { name: 'Growth Fund', share: '60.6%', colour: 'bg-rose-400', width: 'w-[60%]' },
  { name: 'Income Fund', share: '26.2%', colour: 'bg-amber-400', width: 'w-[26%]' },
  { name: 'Money Market', share: '13.2%', colour: 'bg-emerald-400', width: 'w-[13%]' },
];

export function AppPreview() {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200">
      {/* Browser chrome, so the panel reads as the product on the web rather
          than as an illustration floating on its own. */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 bg-slate-50 px-3 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <span className="ml-1 flex-1 truncate rounded-md bg-white px-2.5 py-1 text-[11px] text-slate-500 ring-1 ring-slate-200">
          nivesta.app/portfolio
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
              Current portfolio value
            </p>
            <p className="tabular mt-1 text-2xl font-bold text-slate-900">PKR 192,325</p>
            <p className="tabular text-gain mt-0.5 text-xs font-semibold">+PKR 17,325 · +9.90%</p>
          </div>

          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-700 ring-1 ring-brand-200">
            Live prices
          </span>
        </div>

        {/* The performance line, drawn as a path so it keeps its shape at any
            width without needing a chart library on a signed-out screen. */}
        <svg viewBox="0 0 300 70" className="mt-3 h-20 w-full" aria-hidden="true">
          <defs>
            <linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 52 L30 46 L60 50 L90 38 L120 42 L150 30 L180 34 L210 22 L240 26 L270 14 L300 18 L300 70 L0 70 Z"
            fill="url(#previewFill)"
          />
          <path
            d="M0 52 L30 46 L60 50 L90 38 L120 42 L150 30 L180 34 L210 22 L240 26 L270 14 L300 18"
            fill="none"
            stroke="var(--color-brand-600)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="mt-3 space-y-2 border-t border-slate-200/80 pt-3">
          {HOLDINGS.map((holding) => (
            <div key={holding.name} className="flex items-center gap-2.5">
              <span className="w-24 shrink-0 truncate text-[11px] text-slate-600">
                {holding.name}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span className={`block h-full rounded-full ${holding.colour} ${holding.width}`} />
              </span>
              <span className="tabular w-10 shrink-0 text-right text-[11px] font-semibold text-slate-700">
                {holding.share}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
