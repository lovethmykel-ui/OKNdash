/**
 * Pure data model, route resolver, and high-DPI canvas exporter for
 * auto-generated mobile share cards (Portfolio, Referrals, Profile).
 */

export type ShareCardVariant = 'portfolio' | 'referrals' | 'profile';
export type ShareCardTimeframe = '24h' | '7d' | '30d';
export type ShareCardUnit = 'usd' | 'pct';

export interface ShareCardUserInput {
  displayName: string;
  handle: string;
  avatarUrl?: string | null;
  initials: string;
  referralCode: string;
  portfolioUsd: number;
  referralUsd: number;
  okPoints: number;
  streakDays: number;
  inviteCount: number;
  tierLabel: string;
}

export interface ShareCardModel {
  variant: ShareCardVariant;
  badgeLabel: string;
  tabLabel: string;
  headlineValue: string;
  deltaLabel: string;
  timeframeLabel: ShareCardTimeframe;
  isPositive: boolean;
  series: number[];
  yMaxLabel: string;
  yMinLabel: string;
  xLabels: [string, string, string];
  subMetrics: Array<{ label: string; value: string }>;
  shareSummary: string;
}

export const SHARE_CARD_VARIANTS: readonly ShareCardVariant[] = [
  'portfolio',
  'referrals',
  'profile',
] as const;

export const SHARE_CARD_TIMEFRAMES: readonly ShareCardTimeframe[] = [
  '24h',
  '7d',
  '30d',
] as const;

/**
 * Resolves the contextual share card variant for a given app pathname.
 * Returns null for routes that should not auto-trigger screenshot share cards.
 */
export function resolveShareCardVariant(pathname: string | null | undefined): ShareCardVariant | null {
  if (!pathname) return null;
  // Strip optional locale prefix (e.g. /en/app/portfolio -> /app/portfolio)
  const normalized = pathname.replace(/^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/, '') || '/';

  if (
    normalized === '/app' ||
    normalized === '/app/portfolio' ||
    normalized.startsWith('/app/portfolio/')
  ) {
    return 'portfolio';
  }
  if (normalized === '/app/referral' || normalized.startsWith('/app/referral/')) {
    return 'referrals';
  }
  if (normalized === '/app/settings' || normalized.startsWith('/app/settings/')) {
    return 'profile';
  }
  return null;
}

const TIMEFRAME_X_LABELS: Record<ShareCardTimeframe, [string, string, string]> = {
  '24h': ['Nov 25, 2 AM', 'Nov 25, 2 PM', 'Nov 26, 2 AM'],
  '7d': ['Nov 19', 'Nov 22', 'Nov 26'],
  '30d': ['Oct 27', 'Nov 11', 'Nov 26'],
};

/**
 * Deterministic normalized curve shapes (0..1) per variant and timeframe.
 * Never uses Math.random() so rendering and exports are 100% deterministic.
 */
const CURVE_SHAPES: Record<ShareCardVariant, Record<ShareCardTimeframe, readonly number[]>> = {
  portfolio: {
    '24h': [0.0, 0.08, 0.06, 0.16, 0.28, 0.24, 0.36, 0.45, 0.41, 0.56, 0.68, 0.64, 0.78, 0.87, 0.94, 1.0],
    '7d': [0.0, 0.09, 0.07, 0.18, 0.27, 0.23, 0.42, 0.51, 0.48, 0.64, 0.73, 0.80, 0.86, 0.91, 0.96, 1.0],
    '30d': [0.0, 0.06, 0.12, 0.11, 0.22, 0.32, 0.39, 0.46, 0.55, 0.52, 0.67, 0.75, 0.82, 0.89, 0.95, 1.0],
  },
  referrals: {
    '24h': [0.0, 0.0, 0.04, 0.14, 0.14, 0.26, 0.36, 0.36, 0.49, 0.59, 0.66, 0.76, 0.84, 0.84, 0.94, 1.0],
    '7d': [0.0, 0.06, 0.13, 0.19, 0.28, 0.34, 0.43, 0.52, 0.59, 0.68, 0.76, 0.82, 0.88, 0.92, 0.96, 1.0],
    '30d': [0.0, 0.07, 0.15, 0.24, 0.31, 0.39, 0.46, 0.56, 0.64, 0.72, 0.79, 0.85, 0.90, 0.94, 0.97, 1.0],
  },
  profile: {
    '24h': [0.0, 0.06, 0.06, 0.16, 0.24, 0.28, 0.38, 0.46, 0.54, 0.61, 0.69, 0.75, 0.82, 0.89, 0.95, 1.0],
    '7d': [0.0, 0.10, 0.19, 0.27, 0.36, 0.42, 0.51, 0.59, 0.67, 0.73, 0.79, 0.85, 0.89, 0.93, 0.97, 1.0],
    '30d': [0.0, 0.09, 0.16, 0.24, 0.34, 0.41, 0.50, 0.59, 0.67, 0.74, 0.80, 0.85, 0.90, 0.94, 0.97, 1.0],
  },
};

const DELTA_BY_VARIANT: Record<
  ShareCardVariant,
  Record<ShareCardTimeframe, { usd: number; pct: number; pts: number }>
> = {
  portfolio: {
    '24h': { usd: 142.5, pct: 11.1, pts: 45 },
    '7d': { usd: 318.2, pct: 28.6, pts: 115 },
    '30d': { usd: 612.8, pct: 75.1, pts: 135 },
  },
  referrals: {
    '24h': { usd: 28.5, pct: 25.0, pts: 180 },
    '7d': { usd: 84.0, pct: 143.6, pts: 640 },
    '30d': { usd: 142.5, pct: 218.4, pts: 1420 },
  },
  profile: {
    '24h': { usd: 142.5, pct: 14.2, pts: 25 },
    '7d': { usd: 318.2, pct: 48.0, pts: 85 },
    '30d': { usd: 612.8, pct: 135.0, pts: 135 },
  },
};

export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1000) {
    return `${sign}$${abs.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}

export function formatAxisCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return `$${(abs / 1000).toFixed(2)}k`;
  }
  return `$${Math.round(abs)}`;
}

/**
 * Builds the complete deterministic view model for the share card.
 */
export function buildShareCardModel(
  user: ShareCardUserInput,
  variant: ShareCardVariant,
  timeframe: ShareCardTimeframe,
  unit: ShareCardUnit,
): ShareCardModel {
  const delta = DELTA_BY_VARIANT[variant][timeframe];
  const shape = CURVE_SHAPES[variant][timeframe];

  if (variant === 'portfolio') {
    const endVal = Math.max(0, user.portfolioUsd);
    const startVal = Math.max(0, endVal - delta.usd);
    const series = shape.map((n) => Number((startVal + n * (endVal - startVal)).toFixed(2)));
    const minVal = Math.min(...series);
    const maxVal = Math.max(...series);
    const deltaLabel =
      unit === 'usd'
        ? `+${formatCurrencyCompact(delta.usd)}`
        : `+${delta.pct.toFixed(1)}%`;

    return {
      variant,
      badgeLabel: 'Portfolio',
      tabLabel: 'Your portfolio',
      headlineValue: formatCurrencyCompact(endVal),
      deltaLabel,
      timeframeLabel: timeframe,
      isPositive: delta.usd >= 0,
      series,
      yMaxLabel: formatAxisCurrency(maxVal),
      yMinLabel: formatAxisCurrency(minVal),
      xLabels: TIMEFRAME_X_LABELS[timeframe],
      subMetrics: [
        { label: 'OK Points', value: user.okPoints.toLocaleString('en-US') },
        { label: 'Streak', value: `${user.streakDays}d` },
        { label: 'Referrals', value: `${user.inviteCount}` },
      ],
      shareSummary: `My OKN Portfolio is ${formatCurrencyCompact(endVal)} (${deltaLabel} ${timeframe}). Join with code ${user.referralCode}.`,
    };
  }

  if (variant === 'referrals') {
    const endVal = Math.max(0, user.referralUsd);
    const startVal = Math.max(0, endVal - delta.usd);
    const series = shape.map((n) => Number((startVal + n * (endVal - startVal)).toFixed(2)));
    const minVal = Math.min(...series);
    const maxVal = Math.max(...series);
    const deltaLabel =
      unit === 'usd'
        ? `+${formatCurrencyCompact(delta.usd)}`
        : `+${delta.pct.toFixed(1)}%`;

    return {
      variant,
      badgeLabel: 'Referrals',
      tabLabel: 'Referrals',
      headlineValue: formatCurrencyCompact(endVal),
      deltaLabel,
      timeframeLabel: timeframe,
      isPositive: delta.usd >= 0,
      series,
      yMaxLabel: formatAxisCurrency(maxVal),
      yMinLabel: formatAxisCurrency(minVal),
      xLabels: TIMEFRAME_X_LABELS[timeframe],
      subMetrics: [
        { label: 'Invites', value: `${user.inviteCount}` },
        { label: 'BNB Earned', value: '0.238 BNB' },
        { label: 'Commission', value: '12.5%' },
      ],
      shareSummary: `I've earned ${formatCurrencyCompact(endVal)} in OKN Partner Rewards across ${user.inviteCount} invites. Join with code ${user.referralCode}.`,
    };
  }

  // Profile card
  const endPts = Math.max(10, user.okPoints);
  const startPts = Math.max(0, endPts - delta.pts);
  const series = shape.map((n) => Math.round(startPts + n * (endPts - startPts)));
  const minVal = Math.min(...series);
  const maxVal = Math.max(...series);
  const deltaLabel =
    unit === 'usd'
      ? `+${delta.pts} pts`
      : `+${delta.pct.toFixed(1)}%`;

  return {
    variant,
    badgeLabel: 'Profile',
    tabLabel: 'Profile',
    headlineValue: `${endPts.toLocaleString('en-US')} OK Pts`,
    deltaLabel,
    timeframeLabel: timeframe,
    isPositive: true,
    series,
    yMaxLabel: `${maxVal} pts`,
    yMinLabel: `${minVal} pts`,
    xLabels: TIMEFRAME_X_LABELS[timeframe],
    subMetrics: [
      { label: 'Tier', value: user.tierLabel },
      { label: 'Streak', value: `${user.streakDays}d` },
      { label: 'Portfolio', value: formatCurrencyCompact(user.portfolioUsd) },
    ],
    shareSummary: `${user.handle} on OKN — ${endPts.toLocaleString('en-US')} OK Points (${user.streakDays}-day streak). Join with code ${user.referralCode}.`,
  };
}

/**
 * Generates clean SVG polyline & area fill paths from a numeric data series.
 */
export function buildChartSvgPaths(
  series: readonly number[],
  width: number,
  height: number,
  padTop = 16,
  padBottom = 20,
): { linePath: string; areaPath: string; endPoint: { x: number; y: number } } {
  if (series.length === 0) {
    return { linePath: '', areaPath: '', endPoint: { x: 0, y: height } };
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const usableHeight = Math.max(1, height - padTop - padBottom);
  const stepX = series.length > 1 ? width / (series.length - 1) : width;

  const coords = series.map((val, idx) => {
    const x = Number((idx * stepX).toFixed(2));
    const norm = (val - min) / span;
    const y = Number((padTop + (1 - norm) * usableHeight).toFixed(2));
    return { x, y };
  });

  const linePath = coords
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
    .join(' ');
  const last = coords[coords.length - 1];
  const first = coords[0];
  const areaPath = `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z`;

  return { linePath, areaPath, endPoint: last };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Renders the share card cleanly to a 2x high-DPI PNG Blob via HTML5 Canvas
 * so Copy Image, Native Share, and Download produce crisp shareable assets.
 */
export async function renderShareCardToBlob(params: {
  user: ShareCardUserInput;
  model: ShareCardModel;
  showRefCode: boolean;
}): Promise<Blob> {
  const { user, model, showRefCode } = params;
  const width = 780;
  const height = 980;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Outer vibrant brand frame (purple -> cobalt gradient)
  const frameGrad = ctx.createLinearGradient(0, 0, width, height);
  frameGrad.addColorStop(0, '#7A12F5');
  frameGrad.addColorStop(0.55, '#5B3DF5');
  frameGrad.addColorStop(1, '#2563EB');

  drawRoundedRect(ctx, 0, 0, width, height, 48);
  ctx.fillStyle = frameGrad;
  ctx.fill();

  // Inner dark obsidian card surface
  const pad = 12;
  const footerHeight = 148;
  const innerW = width - pad * 2;
  const innerH = height - pad - footerHeight;
  drawRoundedRect(ctx, pad, pad, innerW, innerH, 38);
  ctx.fillStyle = '#090B12';
  ctx.fill();

  // Subtle top highlight hairline
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Avatar circle
  const avatarX = pad + 44;
  const avatarY = pad + 44;
  const avatarR = 46;
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarR, avatarY + avatarR, avatarR, 0, Math.PI * 2);
  ctx.closePath();
  const avGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarR * 2, avatarY + avatarR * 2);
  avGrad.addColorStop(0, '#7A12F5');
  avGrad.addColorStop(1, '#09B4FF');
  ctx.fillStyle = avGrad;
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 32px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(user.initials.slice(0, 2).toUpperCase(), avatarX + avatarR, avatarY + avatarR + 2);
  ctx.restore();

  // Handle + variant tag
  const metaX = avatarX + avatarR * 2 + 24;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 34px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(user.handle, metaX, avatarY + 4);

  // Subtle variant tag (rectangular matching reference)
  ctx.font = '600 22px Inter, system-ui, -apple-system, sans-serif';
  const badgeTextW = ctx.measureText(model.badgeLabel).width;
  drawRoundedRect(ctx, metaX, avatarY + 50, badgeTextW + 26, 36, 10);
  ctx.fillStyle = 'rgba(122, 18, 245, 0.24)';
  ctx.fill();
  ctx.fillStyle = '#B794FF';
  ctx.textBaseline = 'middle';
  ctx.fillText(model.badgeLabel, metaX + 13, avatarY + 68);

  // Headline value
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 72px Inter, system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(model.headlineValue, avatarX, avatarY + 132);

  // Delta + timeframe
  ctx.font = '700 30px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillStyle = model.isPositive ? '#18E074' : '#FF5A5F';
  ctx.fillText(model.deltaLabel, avatarX, avatarY + 220);
  const deltaW = ctx.measureText(model.deltaLabel).width;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '600 28px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText(model.timeframeLabel, avatarX + deltaW + 16, avatarY + 222);

  // Mini stat strip
  const statY = avatarY + 278;
  model.subMetrics.forEach((m, idx) => {
    const colX = avatarX + idx * 218;
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.font = '600 20px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText(m.label.toUpperCase(), colX, statY);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '700 26px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText(m.value, colX, statY + 28);
  });

  // Performance chart area
  const chartX = avatarX;
  const chartY = statY + 96;
  const chartW = innerW - 88;
  const chartH = 270;
  const accentColor = model.isPositive ? '#18E074' : '#FF5A5F';

  // Subtle horizontal reference lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY + 24);
  ctx.lineTo(chartX + chartW, chartY + 24);
  ctx.moveTo(chartX, chartY + chartH - 36);
  ctx.lineTo(chartX + chartW, chartY + chartH - 36);
  ctx.stroke();

  const series = model.series;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const plotTop = chartY + 34;
  const plotBottom = chartY + chartH - 46;
  const plotH = plotBottom - plotTop;
  const plotW = chartW - 84;
  const stepX = series.length > 1 ? plotW / (series.length - 1) : plotW;

  const pts = series.map((v, i) => ({
    x: chartX + i * stepX,
    y: plotTop + (1 - (v - min) / span) * plotH,
  }));

  // Gradient fill under line
  const areaGrad = ctx.createLinearGradient(0, plotTop, 0, plotBottom + 20);
  areaGrad.addColorStop(0, model.isPositive ? 'rgba(24, 224, 116, 0.24)' : 'rgba(255, 90, 95, 0.24)');
  areaGrad.addColorStop(1, 'rgba(9, 11, 18, 0)');

  ctx.beginPath();
  pts.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.lineTo(pts[pts.length - 1].x, plotBottom + 16);
  ctx.lineTo(pts[0].x, plotBottom + 16);
  ctx.closePath();
  ctx.fillStyle = areaGrad;
  ctx.fill();

  // Crisp stroke line
  ctx.beginPath();
  pts.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Right-aligned Y-axis labels
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font = '600 22px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(model.yMaxLabel, chartX + chartW, plotTop + 4);
  ctx.fillText(model.yMinLabel, chartX + chartW, plotBottom);

  // X-axis labels
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.font = '500 21px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(model.xLabels[0], chartX, chartY + chartH - 18);
  ctx.textAlign = 'center';
  ctx.fillText(model.xLabels[1], chartX + chartW / 2, chartY + chartH - 18);
  ctx.textAlign = 'right';
  ctx.fillText(model.xLabels[2], chartX + chartW, chartY + chartH - 18);

  // Brand footer bar inside outer gradient frame
  const footerCenterY = innerH + pad + footerHeight / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 54px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText('$OKN', 44, footerCenterY);

  ctx.textAlign = 'right';
  if (showRefCode) {
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.font = '500 23px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText('Earn bonus with code', width - 44, footerCenterY - 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 32px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText(user.referralCode, width - 44, footerCenterY + 20);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '700 28px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText('okn.network', width - 44, footerCenterY);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to encode PNG share card'));
    }, 'image/png');
  });
}
