'use client';

/**
 * Pure, deterministic SVG sparkline curve with whisper-soft area gradient
 * for minimalist whale leader cards. Uses a deterministic gradient ID so
 * SSR HTML and client hydration match identically.
 */

interface SparklineChartProps {
  values: number[];
  positive: boolean;
  seed?: string;
  width?: number;
  height?: number;
  ariaLabel?: string;
}

export function SparklineChart({
  values,
  positive,
  seed = 'curve',
  width = 128,
  height = 44,
  ariaLabel,
}: SparklineChartProps) {
  const safeValues = values.length >= 2 ? values : [0, positive ? 1 : -1];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const span = max - min || 1;

  const padX = 2;
  const padY = 6;
  const curveWidth = width - 8;
  const usableHeight = height - padY * 2;

  const coords = safeValues.map((v, i) => {
    const x = padX + (i / (safeValues.length - 1)) * (curveWidth - padX);
    const normalized = (v - min) / span;
    const y = padY + (1 - normalized) * usableHeight;
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  });

  // Smooth quadratic spline through midpoints
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
  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  pathD += ` L ${last.x} ${last.y}`;

  const areaD = `${pathD} L ${last.x} ${height} L ${first.x} ${height} Z`;
  const strokeColor = positive ? '#10B981' : '#F43F5E';
  const safeId = `spark-${seed.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16) || 'pm'}`;

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
      <defs>
        <linearGradient id={safeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${safeId})`} />
      <path
        d={pathD}
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r="3" fill={strokeColor} />
    </svg>
  );
}
