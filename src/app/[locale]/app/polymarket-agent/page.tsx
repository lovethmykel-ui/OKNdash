'use client';

/**
 * /app/polymarket-agent — Polymarket Agent Copier (Agent / Copy / Fund).
 *
 *   - Agent: Landing command screen connecting funding, guardrails, and whale signals.
 *   - Copy: Polymarket Leaderboard mirror (polymarket.com/leaderboard) + 1-click trader copying.
 *   - Fund: Funding of Agent wallet (USDC.e & POL) before engaging live copy trades.
 */
import { Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { AgentCopierTabs } from '@/components/polymarket-agent/agent-copier-tabs';
import { AgentPanel } from '@/components/polymarket-agent/agent-panel';
import { CopierPanel } from '@/components/polymarket-agent/copier-panel';
import { FundsPanel } from '@/components/polymarket-agent/funds-panel';
import { RiskDisclosure } from '@/components/polymarket-agent/risk-disclosure';
import { parseAgentTab, type AgentTab } from '@/components/polymarket-agent/tab-param';

function PolymarketAgentWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = parseAgentTab(searchParams.get('tab'));

  const handleTabChange = useCallback(
    (nextTab: AgentTab) => {
      const target = nextTab === 'agent' ? '/app/polymarket-agent' : `/app/polymarket-agent?tab=${nextTab}`;
      router.replace(target as never, { scroll: false });
    },
    [router],
  );

  return (
    <AgentCopierTabs
      value={activeTab}
      onValueChange={handleTabChange}
      agent={<AgentPanel onNavigateTab={handleTabChange} />}
      copy={<CopierPanel onNavigateTab={handleTabChange} />}
      fund={<FundsPanel onNavigateTab={handleTabChange} />}
    />
  );
}

export default function PolymarketAgentPage() {
  const t = useTranslations('dashboard.polymarketAgent');

  return (
    <main className="space-y-6 pb-24 md:pb-12">
      {/* Editorial Terminal Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--line)] pb-5">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl border border-[#2E5CFF]/25 bg-[#2E5CFF]/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/polymarket.png" alt="Polymarket" className="size-6 sm:size-7 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--tx)] text-balance">
              {t('title')}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[var(--mut)] max-w-2xl">
              {t('description')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--mut)] font-medium shrink-0">
          <span className="font-semibold text-[var(--tx)]">Polygon PoS</span>
          <span aria-hidden="true">·</span>
          <span>USDC.e Collateral</span>
          <span aria-hidden="true">·</span>
          <span>Automated Whale Mirroring</span>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="h-56 rounded-2xl border border-[var(--line)] bg-[var(--s1)] animate-pulse" />
        }
      >
        <PolymarketAgentWorkspace />
      </Suspense>

      <RiskDisclosure />
    </main>
  );
}
