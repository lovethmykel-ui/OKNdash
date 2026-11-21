'use client';

/**
 * polymarket-agent/fee-card.tsx — the Fund tab fee summary.
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Percent } from 'lucide-react';
import { fetchFees, type CopierFeeSummary } from './copier-hooks';

export function FeeCard() {
  const t = useTranslations('dashboard.polymarketAgent.copier.fees');
  const [fees, setFees] = useState<CopierFeeSummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetchFees();
      if (cancelled) return;
      if (res.ok && res.data && typeof res.data.outstandingUsdc === 'string') {
        setFees(res.data);
      } else {
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!fees) {
    return failed ? null : null;
  }

  const fmt = (v: string) => `$${Number(v).toFixed(2)}`;

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--mut)]">
          <Percent className="size-3.5" aria-hidden="true" />
          <span>{t('title')}</span>
        </h2>
      </div>
      <dl className="grid grid-cols-3 gap-4 border-t border-[var(--line)] pt-3.5">
        <div>
          <dt className="text-[11px] font-medium text-[var(--mut)]">{t('outstanding')}</dt>
          <dd className="mt-0.5 font-mono text-lg sm:text-xl font-extrabold tabular-nums text-[var(--tx)]" aria-live="polite">
            {fmt(fees.outstandingUsdc)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-[var(--mut)]">{t('lifetime')}</dt>
          <dd className="mt-0.5 font-mono text-lg sm:text-xl font-extrabold tabular-nums text-[var(--tx)]">
            {fmt(fees.settledUsdc)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-[var(--mut)]">{t('waived')}</dt>
          <dd className="mt-0.5 font-mono text-lg sm:text-xl font-extrabold tabular-nums text-[#10B981]">
            {fmt(fees.waivedUsdc)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
