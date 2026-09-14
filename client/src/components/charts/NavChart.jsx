import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatAxisDate, formatDate, formatNumber } from '@/lib/format.js';

/**
 * Fund price over time.
 *
 * The Y axis is deliberately *not* zero-based: a fund moving between 110 and
 * 118 would look like a flat line against a zero baseline. A padded domain
 * around the actual range shows the movement that matters.
 */
export function NavChart({ data = [], height = 280, colour = '#1f3ded' }) {
  if (data.length === 0) return null;

  const values = data.map((point) => point.nav);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.15 || 1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="navFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colour} stopOpacity={0.24} />
            <stop offset="100%" stopColor={colour} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          minTickGap={48}
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickFormatter={formatAxisDate}
        />

        <YAxis
          domain={[min - padding, max + padding]}
          tickLine={false}
          axisLine={false}
          width={56}
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickFormatter={(value) => formatNumber(value, 0)}
        />

        <Tooltip
          cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }}
          contentStyle={{
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 24px rgb(15 23 42 / 0.08)',
            fontSize: 13,
          }}
          labelFormatter={(value) => formatDate(value)}
          formatter={(value) => [formatNumber(value, 4), 'NAV']}
        />

        <Area
          type="monotone"
          dataKey="nav"
          stroke={colour}
          strokeWidth={2}
          fill="url(#navFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
