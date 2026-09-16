import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  formatAxisDate,
  formatAxisTime,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercent,
} from '@/lib/format.js';

const compact = new Intl.NumberFormat('en-PK', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * How the portfolio has done, in one of two readings.
 *
 * **Value** plots what the holdings are worth with the amount invested drawn
 * behind them, so the gap between the lines is the return.
 *
 * **Return** plots that gap on its own, as a percentage. It exists because the
 * value view has a real weakness: paying money in moves the line far further
 * than any price ever does. A portfolio built up in a few deposits is mostly a
 * staircase, and the price movement — the part the customer actually wants to
 * judge — is a wobble too small to see beside it. Dividing by cost removes the
 * deposits entirely: paying in more money leaves this line exactly where it was.
 */
export function PortfolioValueChart({
  data = [],
  height = 300,
  granularity = 'daily',
  mode = 'value',
}) {
  if (data.length === 0) return null;

  // Someone who invested this morning has one day to plot, so the API switches
  // to intraday points and the axis follows it: a numeric time scale, where a
  // gap in the feed stays a gap rather than being closed up.
  const isIntraday = granularity === 'intraday';
  const isReturn = mode === 'return';

  const points = data.map((point) => ({
    ...point,
    ...(isIntraday ? { at: new Date(point.at).getTime() } : {}),
    returnPct: point.invested > 0 ? ((point.value - point.invested) / point.invested) * 100 : 0,
  }));

  const values = isReturn
    ? points.map((point) => point.returnPct)
    : data.flatMap((point) => [point.value, point.invested]);

  const min = Math.min(...values);
  const max = Math.max(...values);

  /*
    Hug the data. A generous pad turns a chart into mostly empty space: with a
    fifth of the spread above and below, a portfolio that ran from 50k to 920k
    was drawn on an axis reaching 1.2M, and every real move was squeezed into
    the middle of it.

    The floor only drops to zero when the data is genuinely near it — a chart
    that always starts at zero flattens everything above. In the return view it
    may go negative, because a loss is a real reading and clipping it at zero
    would hide exactly the thing somebody is looking for.
  */
  const spread = max - min;
  const padding = spread > 0 ? spread * 0.06 : Math.max(Math.abs(max) * 0.02, isReturn ? 0.1 : 100);
  const lower = isReturn
    ? min - padding
    : min - padding < spread * 0.15
      ? Math.max(0, min - padding)
      : min - padding;

  const isUp = (points[points.length - 1]?.returnPct ?? 0) >= 0;
  const lineColour = isReturn
    ? isUp
      ? 'var(--color-gain)'
      : 'var(--color-loss)'
    : 'var(--color-brand-600)';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -4 }}>
        <defs>
          <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColour} stopOpacity={0.26} />
            <stop offset="100%" stopColor={lineColour} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-200)" vertical={false} />

        <XAxis
          dataKey={isIntraday ? 'at' : 'date'}
          type={isIntraday ? 'number' : 'category'}
          scale={isIntraday ? 'time' : 'auto'}
          domain={isIntraday ? ['dataMin', 'dataMax'] : undefined}
          tickLine={false}
          axisLine={false}
          minTickGap={48}
          tick={{ fill: 'var(--color-slate-400)', fontSize: 12 }}
          tickFormatter={isIntraday ? formatAxisTime : formatAxisDate}
        />

        <YAxis
          domain={[lower, max + padding]}
          tickLine={false}
          axisLine={false}
          width={56}
          tick={{ fill: 'var(--color-slate-400)', fontSize: 12 }}
          tickFormatter={(value) =>
            isReturn ? `${value.toFixed(1)}%` : compact.format(value)
          }
        />

        <Tooltip
          cursor={{ stroke: 'var(--color-slate-500)', strokeDasharray: '3 3' }}
          contentStyle={{
            borderRadius: 10,
            border: '1px solid var(--color-slate-200)',
            backgroundColor: 'var(--color-white)',
            color: 'var(--color-slate-900)',
            boxShadow: '0 8px 24px rgb(15 23 42 / 0.08)',
            fontSize: 13,
          }}
          labelFormatter={(value) => (isIntraday ? formatDateTime(value) : formatDate(value))}
          formatter={(value, name) => [isReturn ? formatPercent(value) : formatCurrency(value), name]}
        />

        {isReturn ? (
          <>
            {/* Break-even, so up and down are read against the line that
                matters rather than against the bottom of the chart. */}
            <ReferenceLine y={0} stroke="var(--color-slate-300)" strokeDasharray="4 4" />

            <Area
              type="monotone"
              dataKey="returnPct"
              name="Return"
              stroke={lineColour}
              strokeWidth={2.4}
              fill="url(#portfolioFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-white)' }}
            />
          </>
        ) : (
          <>
            <Legend
              verticalAlign="top"
              height={32}
              iconType="plainline"
              wrapperStyle={{ fontSize: 13, color: 'var(--color-slate-500)' }}
            />

            <Area
              type="monotone"
              dataKey="value"
              name="Portfolio value"
              stroke={lineColour}
              strokeWidth={2.4}
              fill="url(#portfolioFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-white)' }}
            />

            <Line
              type="monotone"
              dataKey="invested"
              name="Amount invested"
              stroke="var(--color-slate-500)"
              strokeWidth={1.8}
              strokeDasharray="5 4"
              dot={false}
            />
          </>
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
