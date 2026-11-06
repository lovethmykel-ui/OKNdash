'use client';

/**
 * /app/prediction-markets — Prediction Markets (Interactive Demo).
 *
 * Interactive cross-protocol prediction-market browser: filter by category
 * and place instant $25 Demo YES/NO outcome positions.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  CheckCircle2,
  Droplets,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SampleMarket {
  id: string;
  title: string;
  category: string;
  volume: string;
  liquidity: string;
  yesProbability: number;
}

const SAMPLE_MARKETS: SampleMarket[] = [
  { id: 'pm-1', title: 'BTC above $70k by end of Q4', category: 'Crypto', volume: '$4.2M', liquidity: '$810k', yesProbability: 64 },
  { id: 'pm-2', title: 'Next US presidential winner', category: 'Politics', volume: '$12.8M', liquidity: '$2.1M', yesProbability: 53 },
  { id: 'pm-3', title: 'Fed cuts rates in next meeting', category: 'Economics', volume: '$6.4M', liquidity: '$1.3M', yesProbability: 71 },
  { id: 'pm-4', title: 'Lakers make the playoffs', category: 'Sports', volume: '$1.9M', liquidity: '$420k', yesProbability: 47 },
  { id: 'pm-5', title: 'SOL ETF approved this year', category: 'Crypto', volume: '$3.1M', liquidity: '$680k', yesProbability: 58 },
  { id: 'pm-6', title: 'GDP growth above 3% in Q3', category: 'Economics', volume: '$2.5M', liquidity: '$510k', yesProbability: 33 },
];

export default function PredictionMarketsPage() {
  const t = useTranslations('dashboard.predictionMarkets');
  const categories = t.raw('categories') as unknown as string[];
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [positions, setPositions] = useState<Record<string, 'YES' | 'NO'>>({
    'pm-1': 'YES',
  });

  const filteredMarkets = SAMPLE_MARKETS.filter((m) =>
    selectedCategory === 'All' || selectedCategory === categories[0]
      ? true
      : m.category.toLowerCase() === selectedCategory.toLowerCase(),
  );

  const handleBet = (market: SampleMarket, side: 'YES' | 'NO') => {
    setPositions((prev) => ({ ...prev, [market.id]: side }));
    toast.success(`Placed $25 Demo ${side} position on "${market.title}"`);
  };

  return (
    <main className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400">
            <Sparkles data-icon="inline-start" />
            Interactive Demo
          </Badge>
        }
      />

      {/* Hero / status banner */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-ios-blue/10 via-ios-green/5 to-transparent p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ios-blue/10 text-ios-blue">
                <BarChart3 className="size-6" />
              </span>
              <div className="space-y-1">
                <p className="font-display text-lg font-bold md:text-xl">{t('headline')}</p>
                <p className="max-w-prose text-sm text-muted-foreground">{t('body')}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
              <Sparkles className="size-3.5" />
              <span>{Object.keys(positions).length} Active Demo Bets</span>
            </div>
          </div>

          {/* Interactive Category filter chips */}
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((label, i) => {
              const isActive =
                selectedCategory === label || (i === 0 && selectedCategory === 'All');
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedCategory(i === 0 ? 'All' : label)}
                  className={cn(
                    'cursor-pointer inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition-all',
                    isActive
                      ? 'bg-[#7A12F5] text-white ring-[#7A12F5]'
                      : 'bg-card/80 text-foreground/80 ring-border/60 hover:bg-card',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Interactive Market grid */}
      <section aria-label={t('title')} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('headline')}
          </h2>
          <span className="text-xs text-muted-foreground">
            Showing {filteredMarkets.length} markets
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMarkets.map((m) => (
            <MarketCard
              key={m.id}
              market={m}
              activeSide={positions[m.id]}
              onBet={(side) => handleBet(m, side)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function MarketCard({
  market,
  activeSide,
  onBet,
}: {
  market: SampleMarket;
  activeSide?: 'YES' | 'NO';
  onBet: (side: 'YES' | 'NO') => void;
}) {
  const yesLeading = market.yesProbability >= 50;
  return (
    <Card className={cn('transition-all', activeSide && 'border-emerald-500/50')}>
      <CardContent className="space-y-3 p-4">
        {/* Header: category + title */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ios-blue">
              {market.category}
            </p>
            <p className="text-sm font-semibold leading-snug">{market.title}</p>
          </div>
          {activeSide && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              <CheckCircle2 className="size-3" />
              {activeSide} ($25)
            </span>
          )}
        </div>

        {/* Volume + liquidity stats */}
        <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-center">
          <Stat icon={TrendingUp} label="Volume" value={market.volume} />
          <Stat icon={Droplets} label="Liquidity" value={market.liquidity} />
        </div>

        {/* Probability bar */}
        <div className="border-t border-border/60 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className={cn('font-semibold', yesLeading ? 'text-ios-green' : 'text-ios-red')}>
              YES {market.yesProbability}%
            </span>
            <span className={cn('font-semibold', !yesLeading ? 'text-ios-green' : 'text-ios-red')}>
              NO {100 - market.yesProbability}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ios-red/20">
            <div
              className="h-full rounded-full bg-ios-green"
              style={{ width: `${market.yesProbability}%` }}
            />
          </div>
        </div>

        {/* Interactive Bet buttons */}
        <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBet('YES')}
            className={cn(
              'h-8 cursor-pointer text-xs font-bold',
              activeSide === 'YES'
                ? 'border-ios-green bg-ios-green text-white hover:bg-ios-green/90'
                : 'border-ios-green/40 bg-ios-green/10 text-ios-green hover:bg-ios-green/20',
            )}
          >
            Bet YES ({market.yesProbability}¢)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBet('NO')}
            className={cn(
              'h-8 cursor-pointer text-xs font-bold',
              activeSide === 'NO'
                ? 'border-ios-red bg-ios-red text-white hover:bg-ios-red/90'
                : 'border-ios-red/40 bg-ios-red/10 text-ios-red hover:bg-ios-red/20',
            )}
          >
            Bet NO ({100 - market.yesProbability}¢)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </p>
      <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums">{value}</p>
    </div>
  );
}
