'use client';

/**
 * /app/trade-bot — AI Trading Agent ("Coming Soon" state).
 *
 * Displays a clean, minimalist Coming Soon state for the AI Trading Agent
 * along with its planned capabilities.
 */
import { useTranslations } from 'next-intl';
import { Activity, Bot, Clock, Gauge, ShieldCheck, Target } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { OknWatermark } from '@/components/ui/okn-watermark';

const CAPABILITY_ICONS = [Activity, Target, Gauge, ShieldCheck];

export default function TradeBotPage() {
  const t = useTranslations('dashboard.tradeBot');
  const capabilities = t.raw('capabilities') as unknown as string[];

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
        <OknWatermark variant="card" size="lg" />
        <div className="mx-auto max-w-2xl space-y-5 relative z-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl border border-[#7A12F5]/35 bg-[#7A12F5]/15 text-[#C9A6FF] shadow-[0_8px_28px_rgba(122,18,245,0.25)]">
            <Bot className="size-7 stroke-[2.2]" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FFD60A]/35 bg-[#FFD60A]/12 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#FFD60A]">
            <Clock className="size-3.5" />
            <span>Coming Soon</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--tx)]">
            AI Trading Agent — Coming Soon
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-[var(--mut)] leading-relaxed max-w-xl mx-auto">
            {t('body')}
          </p>

          {/* Planned Capabilities Preview */}
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {capabilities.map((label, i) => {
              const Icon = CAPABILITY_ICONS[i] ?? Activity;
              return (
                <div
                  key={label}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 flex items-center gap-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#7A12F5]/15 text-[#C9A6FF]">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[var(--tx)]">
                    {label}
                  </span>
                </div>
              );
            })}
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
        </div>

        {/* Ambient lighting */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 size-80 rounded-full bg-[#7A12F5]/12 blur-3xl" />
      </section>
    </main>
  );
}
