'use client';

/**
 * Pure, deterministic SVG sparkline curve for whale leaderboard cards.
 * Zero Math.random() or client-only state so SSR and hydration always match.
 */

interface SparklineChartProps {
  values: number[];
  positive: boolean;
  width?: number;
  height?: number;
  ariaLabel?: string;
}

export function SparklineChart({
  values,
  positive,
  width = 112,
  height = 36,
  ariaLabel,
}: SparklineChartProps) {
  const safeValues = values.length >= 2 ? values : [0, positive ? 1 : -1];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const span = max - min || 1;

  const padX = 2;
  const padY = 5;
  const curveWidth = Math.round(width * 0.74);
  const usableHeight = height - padY * 2;

  const coords = safeValues.map((v, i) => {
    const x = padX + (i / (safeValues.length - 1)) * (curveWidth - padX);
    const normalized = (v - min) / span;
    const y = padY + (1 - normalized) * usableHeight;
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  });

  // Build smooth quadratic path through midpoints
  let pathD = `M ${coords[0]!.x} ${coords[0]!.y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1]!;
    const curr = coords[i]!;
    const midX = Number(((prev.x + curr.x) / 2).toFixed(2));
    const midY = Number(((prev.y + curr.y) / 2).toFixed(2));
    if (i === 1) {
      pathD += ` L ${midX} ${midY}`;
    } else {
      pathD += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
    }
  }
  const last = coords[coords.length - 1]!;
  pathD += ` L ${last.x} ${last.y}`;

  const strokeColor = positive ? '#10B981' : '#F43F5E';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      role="img"
      aria-label={ariaLabel ?? (positive ? 'Positive PnL trend' : 'Negative PnL trend')}
      className="shrink-0 overflow-visible"
    >
      {/* Subtle dashed projection baseline matching reference card layout */}
      <line
        x1={last.x + 4}
        y1={last.y}
        x2={width - 2}
        y2={last.y}
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        strokeLinecap="round"
      />
      <path
        d={pathD}
        stroke={strokeColor}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r="2.5" fill={strokeColor} />
    </svg>
  );
}
