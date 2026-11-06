'use client';

/**
 * polymarket-agent/agent-panel.tsx — Interactive Demo of the Polymarket Agent tab.
 *
 * Allows users to inspect whale event positions and 1-click mirror YES/NO positions
 * in Demo Mode.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Activity, CheckCircle2, Gauge, ShieldCheck, Sparkles, Target, TrendingUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EventPosition {
  id: string;
  title: string;
  yesProbability: number;
  noProbability: number;
  conviction: number;
  size: 'S' | 'M' | 'L';
  defaultSide: 'YES' | 'NO';
}

const SAMPLE_EVENTS: EventPosition[] = [
  { id: 'ev-1', title: 'BTC above $70k by end of Q4', yesProbability: 64, noProbability: 36, conviction: 78, size: 'M', defaultSide: 'YES' },
  { id: 'ev-2', title: 'ETH flippening in 2026', yesProbability: 22, noProbability: 78, conviction: 41, size: 'S', defaultSide: 'NO' },
  { id: 'ev-3', title: 'Fed cuts rates in next meeting', yesProbability: 71, noProbability: 29, conviction: 82, size: 'L', defaultSide: 'YES' },
  { id: 'ev-4', title: 'SOL ETF approved this year', yesProbability: 58, noProbability: 42, conviction: 66, size: 'M', defaultSide: 'YES' },
  { id: 'ev-5', title: 'BNB above $650 this month', yesProbability: 49, noProbability: 51, conviction: 53, size: 'S', defaultSide: 'NO' },
  { id: 'ev-6', title: 'US recession declared in 2026', yesProbability: 38, noProbability: 62, conviction: 59, size: 'M', defaultSide: 'NO' },
];

const CAPABILITY_ICONS = [Activity, Target, Gauge, ShieldCheck];

export function AgentPanel() {
  const t = useTranslations('dashboard.polymarketAgent');
  const capabilities = t.raw('capabilities') as unknown as string[];
  const [mirrored, setMirrored] = useState<Record<string, 'YES' | 'NO'>>({
    'ev-3': 'YES',
  });

  const handleMirror = (event: EventPosition, side: 'YES' | 'NO') => {
    setMirrored((prev) => ({ ...prev, [event.id]: side }));
    toast.success(`Mirrored ${side} on "${event.title}" ($25 Demo Copy)`);
  };

  return (
    <div className="space-y-6">
      {/* Hero / status banner */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-ios-purple/10 via-ios-blue/5 to-transparent p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ios-purple/10 text-ios-purple">
                <TrendingUpDown className="size-6" />
              </span>
              <div className="space-y-1">
                <p className="font-display text-lg font-bold md:text-xl">{t('headline')}</p>
                <p className="max-w-prose text-sm text-muted-foreground">{t('body')}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
              <Sparkles className="size-3.5" />
              <span>Interactive Demo Active</span>
            </div>
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

      {/* Interactive Event grid */}
      <section aria-label={t('headline')} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('headline')}
          </h2>
          <span className="text-xs font-medium text-emerald-400">
            {Object.keys(mirrored).length} active mirrored {Object.keys(mirrored).length === 1 ? 'position' : 'positions'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_EVENTS.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              activeSide={mirrored[e.id]}
              onMirror={(side) => handleMirror(e, side)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function EventCard({
  event,
  activeSide,
  onMirror,
}: {
  event: EventPosition;
  activeSide?: 'YES' | 'NO';
  onMirror: (side: 'YES' | 'NO') => void;
}) {
  const yesIsStronger = event.yesProbability >= event.noProbability;
  const sizeTone =
    event.size === 'L' ? 'bg-ios-green' : event.size === 'M' ? 'bg-ios-blue' : 'bg-ios-gray3';

  return (
    <Card className={cn('transition-all', activeSide && 'border-emerald-500/50')}>
      <CardContent className="space-y-3 p-4">
        {/* Header: event title + size badge */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug">{event.title}</p>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase"
            aria-label={`Size ${event.size}`}
          >
            <span className={cn('size-1.5 rounded-full', sizeTone)} />
            {event.size}
          </span>
        </div>

        {/* YES / NO probabilities */}
        <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-center">
          <Probability label="YES" value={event.yesProbability} tone={yesIsStronger ? 'pos' : 'neutral'} />
          <Probability label="NO" value={event.noProbability} tone={!yesIsStronger ? 'neg' : 'neutral'} />
        </div>

        {/* Conviction + Interactive Mirror actions */}
        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
            <Activity className="size-3.5 text-ios-blue" />
            {event.conviction}% conviction
          </span>
          {activeSide ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              Mirrored {activeSide}
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMirror('YES')}
                className="h-7 cursor-pointer border-ios-green/40 bg-ios-green/10 px-2.5 text-[11px] font-bold text-ios-green hover:bg-ios-green/20"
              >
                Mirror YES
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMirror('NO')}
                className="h-7 cursor-pointer border-ios-red/40 bg-ios-red/10 px-2.5 text-[11px] font-bold text-ios-red hover:bg-ios-red/20"
              >
                Mirror NO
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Probability({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'pos' | 'neg' | 'neutral';
}) {
  return (
    <div
      className={cn(
        'rounded-md px-2 py-1.5',
        tone === 'pos' && 'bg-ios-green/10',
        tone === 'neg' && 'bg-ios-red/10',
        tone === 'neutral' && 'bg-muted/50',
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-0.5 font-mono text-sm font-bold tabular-nums',
          tone === 'pos' && 'text-ios-green',
          tone === 'neg' && 'text-ios-red',
          tone === 'neutral' && 'text-foreground',
        )}
      >
        {value}%
      </p>
    </div>
  );
}
