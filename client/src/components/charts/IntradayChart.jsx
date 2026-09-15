import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatAxisTime, formatDateTime, formatNumber } from '@/lib/format.js';

/**
 * Fund price through the day, one point per published tick.
 *
 * Plotted against a numeric time axis rather than the index, so a gap in the
 * feed — a restart, a missed tick — shows as a gap in time instead of being
 * quietly closed up and making the day look denser than it was.
 *
 * Like the daily chart, the Y axis is not zero-based: an intraday range is a
 * fraction of a percent, and against a zero baseline it would be a flat line.
 */
export function IntradayChart({ data = [], height = 280, colour = null }) {
  if (data.length < 2) return null;

  const points = data.map((tick) => ({ at: new Date(tick.at).getTime(), nav: tick.nav }));

  const values = points.map((point) => point.nav);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.15 || 0.5;

  // Down days are red, up days green — the same colour language as every other
  // gain and loss in the application.
  const isUp = values[values.length - 1] >= values[0];
  const stroke = colour ?? (isUp ? '#16a34a' : '#dc2626');

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="intradayFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.24} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

        <XAxis
          dataKey="at"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickLine={false}
          axisLine={false}
          minTickGap={48}
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickFormatter={formatAxisTime}
        />

        <YAxis
          domain={[min - padding, max + padding]}
          tickLine={false}
          axisLine={false}
          width={56}
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickFormatter={(value) => formatNumber(value, 2)}
        />

        <Tooltip
          cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }}
          contentStyle={{
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 24px rgb(15 23 42 / 0.08)',
            fontSize: 13,
          }}
          labelFormatter={(value) => formatDateTime(value)}
          formatter={(value) => [formatNumber(value, 4), 'NAV']}
        />

        <Area
          type="monotone"
          dataKey="nav"
          stroke={stroke}
          strokeWidth={2}
          fill="url(#intradayFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
