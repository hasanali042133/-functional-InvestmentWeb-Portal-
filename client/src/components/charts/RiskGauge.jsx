import { formatNumber } from '@/lib/format.js';

/**
 * Where the portfolio sits on the risk scale.
 *
 * Three segments, not the five a gauge usually gets: the application classifies
 * funds as low, medium or high, and inventing intermediate bands would imply a
 * precision the underlying data does not have.
 */

const CENTRE_X = 100;
const CENTRE_Y = 100;
const OUTER_R = 82;
const INNER_R = 58;

const SEGMENTS = [
  { level: 'LOW', label: 'Low', from: 180, to: 120, colour: '#34d399' },
  { level: 'MEDIUM', label: 'Medium', from: 120, to: 60, colour: '#fbbf24' },
  { level: 'HIGH', label: 'High', from: 60, to: 0, colour: '#fb7185' },
];

/** Polar to cartesian, with the SVG y axis pointing down. */
const point = (radius, degrees) => {
  const radians = (degrees * Math.PI) / 180;
  return [CENTRE_X + radius * Math.cos(radians), CENTRE_Y - radius * Math.sin(radians)];
};

const segmentPath = (from, to) => {
  const [x1, y1] = point(OUTER_R, from);
  const [x2, y2] = point(OUTER_R, to);
  const [x3, y3] = point(INNER_R, to);
  const [x4, y4] = point(INNER_R, from);

  return [
    `M ${x1} ${y1}`,
    `A ${OUTER_R} ${OUTER_R} 0 0 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${INNER_R} ${INNER_R} 0 0 0 ${x4} ${y4}`,
    'Z',
  ].join(' ');
};

// Score runs 1 (entirely low risk) to 3 (entirely high risk); the dial runs the
// other way, from 180 degrees on the left to 0 on the right.
const angleForScore = (score) => 180 - ((Math.min(3, Math.max(1, score)) - 1) / 2) * 180;

export function RiskGauge({ score, level }) {
  if (score === null || score === undefined) return null;

  const angle = angleForScore(score);
  const [needleX, needleY] = point(OUTER_R - 12, angle);
  const active = SEGMENTS.find((segment) => segment.level === level);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 118" className="w-full max-w-[16rem]" role="img"
        aria-label={`Portfolio risk ${formatNumber(score, 2)} out of 3, rated ${active?.label ?? level}`}
      >
        {SEGMENTS.map((segment) => (
          <path
            key={segment.level}
            d={segmentPath(segment.from, segment.to)}
            fill={segment.colour}
            // The band the portfolio actually falls in is the one that reads;
            // the others are there for scale, not for attention.
            opacity={segment.level === level ? 1 : 0.28}
          />
        ))}

        <line
          x1={CENTRE_X}
          y1={CENTRE_Y}
          x2={needleX}
          y2={needleY}
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ transition: 'all 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)' }}
        />
        <circle cx={CENTRE_X} cy={CENTRE_Y} r="7" fill="#0f172a" />
        <circle cx={CENTRE_X} cy={CENTRE_Y} r="2.5" fill="#fff" />
      </svg>

      <div className="-mt-1 flex w-full max-w-[16rem] justify-between px-1 text-xs font-medium text-slate-500">
        {SEGMENTS.map((segment) => (
          <span key={segment.level} className={segment.level === level ? 'text-slate-900' : ''}>
            {segment.label}
          </span>
        ))}
      </div>
    </div>
  );
}
