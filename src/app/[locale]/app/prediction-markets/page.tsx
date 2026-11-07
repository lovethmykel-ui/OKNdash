'use client';

/**
 * /app/prediction-markets — Prediction Markets ("Coming Soon" state).
 *
 * Displays a clean, minimalist Coming Soon state for Decentralized Prediction Markets.
 */
import { useTranslations } from 'next-intl';
import { BarChart3, Clock, ShieldCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function PredictionMarketsPage() {
  const t = useTranslations('dashboard.predictionMarkets');
  const categories = t.raw('categories') as unknown as string[];

  return (
    <main className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--tx)]">
            {t('title')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--mut)]">
            {t('description')}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFD60A]/40 bg-[#FFD60A]/15 px-3.5 py-1.5 text-xs font-extrabold text-[#FFD60A]">
          <Clock className="size-3.5" />
          <span>Coming Soon</span>
        </span>
      </div>

      {/* Main Coming Soon Space */}
      <section className="relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-6 sm:p-10 md:p-14 text-center shadow-sm">
        <div className="mx-auto max-w-2xl space-y-5 relative z-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl border border-[#09B4FF]/35 bg-[#09B4FF]/15 text-[#09B4FF] shadow-[0_8px_28px_rgba(9,180,255,0.2)]">
            <BarChart3 className="size-7 stroke-[2.2]" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FFD60A]/35 bg-[#FFD60A]/12 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#FFD60A]">
            <Clock className="size-3.5" />
            <span>Coming Soon</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--tx)]">
            Prediction Markets — Coming Soon
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-[var(--mut)] leading-relaxed max-w-xl mx-auto">
            {t('body')}
          </p>

          {/* Planned Market Categories */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3.5 py-2 text-xs font-extrabold text-[var(--tx)]"
              >
                {cat}
              </span>
            ))}
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app/buy"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#7A12F5] px-6 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-[#7A12F5]/25 hover:bg-[#8C38F7] transition-all"
            >
              Buy $OKN Presale
            </Link>
            <Link
              href="/app/tasks"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s2)] px-5 text-xs sm:text-sm font-bold text-[var(--tx)] hover:bg-[var(--line)]/50 transition-all"
            >
              Earn Free OK Points
            </Link>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-[var(--mut)]">
            <ShieldCheck className="size-4 text-[#2FBD8E] shrink-0" />
            <span>On-chain YES / NO outcome shares · Instant settlement</span>
          </div>
        </div>

        {/* Ambient lighting */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 size-80 rounded-full bg-[#09B4FF]/12 blur-3xl" />
      </section>
    </main>
  );
}
