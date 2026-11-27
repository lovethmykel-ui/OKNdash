'use client';

/**
 * /app/polymarket-agent — Minimalist Polymarket Copy Agent Dashboard.
 */
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { AgentCopierTabs } from '@/components/polymarket-agent/agent-copier-tabs';
import { AgentPanel } from '@/components/polymarket-agent/agent-panel';
import { CopierPanel } from '@/components/polymarket-agent/copier-panel';
import { FundsPanel } from '@/components/polymarket-agent/funds-panel';
import { RiskDisclosure } from '@/components/polymarket-agent/risk-disclosure';
import { parseAgentTab, type AgentTab } from '@/components/polymarket-agent/tab-param';

/**
 * Isolated query-param reader wrapped in `<Suspense fallback={null}>` so
 * `useSearchParams()` never triggers an SSR Suspense bailout on the main page.
 */
function AgentTabParamSync({ onTabParam }: { onTabParam: (tab: AgentTab) => void }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    onTabParam(parseAgentTab(tabParam));
  }, [tabParam, onTabParam]);

  return null;
}

export default function PolymarketAgentPage() {
  const t = useTranslations('dashboard.polymarketAgent');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AgentTab>('agent');

  const handleTabChange = useCallback(
    (nextTab: AgentTab) => {
      setActiveTab(nextTab);
      const target =
        nextTab === 'agent'
          ? '/app/polymarket-agent'
          : `/app/polymarket-agent?tab=${nextTab}`;
      router.replace(target as never, { scroll: false });
    },
    [router],
  );

  return (
    <div className="space-y-5 pb-24 md:pb-10">
      <Suspense fallback={null}>
        <AgentTabParamSync onTabParam={setActiveTab} />
      </Suspense>

      {/* Compact Single-Row Dashboard Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--s1)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/polymarket.png"
              alt="Polymarket"
              className="size-4.5 object-contain"
            />
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--tx)] truncate">
            {t('title')}
          </h1>
        </div>

        <p className="hidden sm:flex items-center gap-2 text-xs text-[var(--mut)] font-medium shrink-0">
          <span>Polygon</span>
          <span aria-hidden="true">·</span>
          <span>USDC.e</span>
        </p>
      </header>

      <AgentCopierTabs
        value={activeTab}
        onValueChange={handleTabChange}
        agent={<AgentPanel onNavigateTab={handleTabChange} />}
        copy={<CopierPanel onNavigateTab={handleTabChange} />}
        fund={<FundsPanel onNavigateTab={handleTabChange} />}
      />

      <RiskDisclosure />
    </div>
  );
}
