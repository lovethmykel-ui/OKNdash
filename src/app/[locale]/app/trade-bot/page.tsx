'use client';

/**
 * /app/trade-bot — AI Trading Agent (Interactive Demo).
 *
 * Interactive automated signal surface: filter long / short crypto signals
 * and 1-click copy any signal into a simulated demo position.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Gauge,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Direction = 'long' | 'short';

interface Signal {
  pair: string;
  direction: Direction;
  entry: string;
  target: string;
  stop: string;
  confidence: number;
  timeframe: string;
}

const SAMPLE_SIGNALS: Signal[] = [
  { pair: 'BTC / USDT', direction: 'long', entry: '64,200', target: '67,500', stop: '62,800', confidence: 78, timeframe: '4h' },
  { pair: 'ETH / USDT', direction: 'short', entry: '3,480', target: '3,280', stop: '3,560', confidence: 64, timeframe: '4h' },
  { pair: 'SOL / USDT', direction: 'long', entry: '142.5', target: '158.0', stop: '136.0', confidence: 71, timeframe: '1h' },
  { pair: 'BNB / USDT', direction: 'long', entry: '588.0', target: '615.0', stop: '575.0', confidence: 66, timeframe: '4h' },
  { pair: 'XRP / USDT', direction: 'short', entry: '0.6240', target: '0.5880', stop: '0.6420', confidence: 59, timeframe: '1h' },
  { pair: 'ADA / USDT', direction: 'long', entry: '0.4520', target: '0.4850', stop: '0.4380', confidence: 73, timeframe: '4h' },
  { pair: 'DOGE / USDT', direction: 'short', entry: '0.1580', target: '0.1420', stop: '0.1660', confidence: 61, timeframe: '4h' },
  { pair: 'AVAX / USDT', direction: 'long', entry: '27.40', target: '30.50', stop: '26.20', confidence: 68, timeframe: '1h' },
  { pair: 'LINK / USDT', direction: 'long', entry: '14.80', target: '16.20', stop: '14.10', confidence: 70, timeframe: '4h' },
];

const CAPABILITY_ICONS = [Activity, Target, Gauge, ShieldCheck];

export default function TradeBotPage() {
  const t = useTranslations('dashboard.tradeBot');
  const capabilities = t.raw('capabilities') as unknown as string[];
  const [filter, setFilter] = useState<'all' | Direction>('all');
  const [copiedPairs, setCopiedPairs] = useState<string[]>(['BTC / USDT']);
  const [autoExecute, setAutoExecute] = useState(true);

  const visibleSignals = SAMPLE_SIGNALS.filter((s) =>
    filter === 'all' ? true : s.direction === filter,
  );

  const handleCopySignal = (signal: Signal) => {
    if (copiedPairs.includes(signal.pair)) {
      setCopiedPairs((prev) => prev.filter((p) => p !== signal.pair));
      toast.info(`Closed demo position on ${signal.pair}`);
      return;
    }
    setCopiedPairs((prev) => [...prev, signal.pair]);
    toast.success(
      `Executed demo ${signal.direction.toUpperCase()} on ${signal.pair} @ ${signal.entry} (TP ${signal.target} / SL ${signal.stop})`,
    );
  };

  return (
    <main className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-400">
            <Sparkles data-icon="inline-start" />
            Market Preview — In Development
          </Badge>
        }
      />

      {/* Hero / status banner */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-ios-indigo/10 via-ios-blue/5 to-transparent p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ios-indigo/10 text-ios-indigo">
                <Bot className="size-6" />
              </span>
              <div className="space-y-1">
                <p className="font-display text-lg font-bold md:text-xl">{t('headline')}</p>
                <p className="max-w-prose text-sm text-muted-foreground">{t('body')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAutoExecute((v) => !v);
                toast.success(!autoExecute ? 'AI Co-Pilot Preview Enabled' : 'AI Co-Pilot Paused');
              }}
              className={cn(
                'flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors',
                autoExecute
                  ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                  : 'border-border/60 bg-card/80 text-muted-foreground',
              )}
            >
              <span className={cn('size-2 rounded-full', autoExecute ? 'bg-amber-400 animate-pulse' : 'bg-muted-foreground')} />
              <span>{autoExecute ? 'Market Preview — In Development' : 'Preview Paused'}</span>
            </button>
          </div>

          {/* Capability chips */}
          <div className="mt-5 flex flex-wrap gap-2">
            {capabilities.map((label, i) => {
              const Icon = CAPABILITY_ICONS[i] ?? Activity;
              return (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border/60"
                >
                  <Icon className="size-3.5 text-ios-blue" />
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Interactive Signal grid */}
      <section aria-label={t('signalPreviewAria')} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('signalHeading')}
            </h2>
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-400">
              Coming Soon · {copiedPairs.length} Preview {copiedPairs.length === 1 ? 'Signal' : 'Signals'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {(['all', 'long', 'short'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={cn(
                  'cursor-pointer rounded-full px-3 py-1 text-xs font-bold uppercase transition-colors',
                  filter === tab
                    ? 'bg-[#7A12F5] text-white'
                    : 'bg-card text-muted-foreground hover:text-foreground ring-1 ring-border/60',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSignals.map((s) => (
            <SignalCard
              key={`${s.pair}-${s.direction}`}
              signal={s}
              isCopied={copiedPairs.includes(s.pair)}
              onCopy={() => handleCopySignal(s)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function SignalCard({
  signal,
  isCopied,
  onCopy,
}: {
  signal: Signal;
  isCopied: boolean;
  onCopy: () => void;
}) {
  const t = useTranslations('dashboard.tradeBot');
  const isLong = signal.direction === 'long';
  const DirIcon = isLong ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className={cn('transition-all', isCopied && 'border-emerald-500/50')}>
      <CardContent className="space-y-3 p-4">
        {/* Header: pair + direction */}
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-mono text-sm font-semibold">{signal.pair}</p>
          <DirectionTag isLong={isLong} icon={DirIcon} />
        </div>

        {/* Timeframe + confidence */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('timeframe', { value: signal.timeframe })}</span>
          <ConfidenceMeter value={signal.confidence} />
        </div>

        {/* Levels */}
        <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
          <Level label={t('entry')} value={signal.entry} />
          <Level label={t('target')} value={signal.target} tone="pos" />
          <Level label={t('stop')} value={signal.stop} tone="neg" />
        </div>

        {/* Interactive action footer */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
          <span className="font-mono text-muted-foreground">
            #TB-{signal.pair.slice(0, 3).toUpperCase()}
          </span>
          <Button
            size="sm"
            variant={isCopied ? 'outline' : 'default'}
            onClick={onCopy}
            className={cn(
              'h-7 cursor-pointer px-3 text-xs font-bold',
              isCopied
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-[#7A12F5] text-white hover:bg-[#6909D8]',
            )}
          >
            {isCopied ? (
              <>
                <CheckCircle2 className="mr-1 size-3.5" />
                Preview Active
              </>
            ) : (
              <>
                <Play className="mr-1 size-3" />
                Copy Signal
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DirectionTag({
  isLong,
  icon: Icon,
}: {
  isLong: boolean;
  icon: typeof ArrowUpRight;
}) {
  const t = useTranslations('dashboard.tradeBot');
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
        isLong ? 'bg-ios-green/10 text-ios-green' : 'bg-ios-red/10 text-ios-red',
      )}
    >
      <Icon className="size-3.5" />
      {isLong ? t('long') : t('short')}
    </span>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const t = useTranslations('dashboard.tradeBot');
  const clamped = Math.max(0, Math.min(100, value));
  const tone =
    clamped >= 70 ? 'bg-ios-green' : clamped >= 60 ? 'bg-ios-blue' : 'bg-ios-orange';
  return (
    <div className="flex items-center gap-1.5" aria-label={t('confidenceAria', { value: clamped })}>
      <span className="tabular-nums text-muted-foreground">{clamped}%</span>
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-muted">
        <span className={cn('block h-full rounded-full', tone)} style={{ width: `${clamped}%` }} />
      </span>
    </div>
  );
}

function Level({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'pos' | 'neg';
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-0.5 font-mono text-xs font-semibold tabular-nums',
          tone === 'pos' && 'text-ios-green',
          tone === 'neg' && 'text-ios-red',
          !tone && 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  );
}
