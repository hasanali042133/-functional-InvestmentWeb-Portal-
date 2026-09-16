import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, formatPercent } from '@/lib/format.js';

/**
 * Colours are keyed to risk level rather than assigned by position, so the same
 * fund keeps the same colour everywhere and the palette itself carries meaning:
 * green is the cautious holding, red the adventurous one.
 */
const RISK_COLOURS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#e11d48',
};

const FALLBACK = 'var(--color-slate-400)';

export function DistributionChart({ holdings = [], height = 260 }) {
  if (holdings.length === 0) return null;

  const data = holdings.map((holding) => ({
    name: holding.productName,
    value: holding.currentValue,
    sharePct: holding.sharePct,
    riskLevel: holding.riskLevel,
  }));

  // Derived from the known height so the donut keeps its proportions at any
  // container width.
  const outerRadius = Math.round(height * 0.4);
  const innerRadius = Math.round(height * 0.26);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
              // The entry animation grows each sector from a zero radius, and in
              // this Recharts build it never advances — leaving the sector
              // groups in the DOM with no geometry, so the donut is invisible.
              // Drawing it at its final size is the reliable behaviour.
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={RISK_COLOURS[entry.riskLevel] ?? FALLBACK} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: '1px solid var(--color-slate-200)',
            backgroundColor: 'var(--color-white)',
            color: 'var(--color-slate-900)',
                boxShadow: '0 8px 24px rgb(15 23 42 / 0.08)',
                fontSize: 13,
              }}
              formatter={(value, name) => [formatCurrency(value), name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* A legend as a list, not floating labels — it stays readable on a phone
          and gives each slice its exact share. */}
      <ul className="w-full space-y-3 sm:w-1/2">
        {data.map((entry) => (
          <li key={entry.name} className="flex items-center gap-3">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: RISK_COLOURS[entry.riskLevel] ?? FALLBACK }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{entry.name}</span>
            <span className="tabular text-sm font-semibold text-slate-900">
              {formatPercent(entry.sharePct, { signed: false, decimals: 1 })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
