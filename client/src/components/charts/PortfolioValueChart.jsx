import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatAxisDate, formatCurrency, formatDate } from '@/lib/format.js';

const compact = new Intl.NumberFormat('en-PK', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Portfolio value over time, with the amount invested drawn behind it.
 *
 * Value alone does not tell a customer whether they are ahead — it rises simply
 * because they put more money in. Plotting cost against it makes the gap
 * between the two lines the actual return.
 */
export function PortfolioValueChart({ data = [], height = 300 }) {
  if (data.length === 0) return null;

  const values = data.flatMap((point) => [point.value, point.invested]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.2 || 1000;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -4 }}>
        <defs>
          <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity={0.26} />
            <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
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
          domain={[Math.max(0, min - padding), max + padding]}
          tickLine={false}
          axisLine={false}
          width={56}
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickFormatter={(value) => compact.format(value)}
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
          formatter={(value, name) => [formatCurrency(value), name]}
        />

        <Legend
          verticalAlign="top"
          height={32}
          iconType="plainline"
          wrapperStyle={{ fontSize: 13, color: '#475569' }}
        />

        <Area
          type="monotone"
          dataKey="value"
          name="Portfolio value"
          stroke="#0d9488"
          strokeWidth={2.4}
          fill="url(#portfolioFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
        />

        <Line
          type="monotone"
          dataKey="invested"
          name="Amount invested"
          stroke="#94a3b8"
          strokeWidth={1.8}
          strokeDasharray="5 4"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
