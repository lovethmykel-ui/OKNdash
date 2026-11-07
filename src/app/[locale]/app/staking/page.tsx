'use client';

/**
 * /app/staking — $OKN Staking Vault ("Coming Soon" state).
 *
 * Displays a minimalist, clean Coming Soon state in the Staking space along with
 * a preview of the planned lock tiers and APY multipliers.
 */
import { useTranslations } from 'next-intl';
import { Clock, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const PLANNED_TIERS = [
  { days: '30 Days', apy: '14% APY', multiplier: '1.0x Points' },
  { days: '90 Days', apy: '28% APY', multiplier: '1.5x Points' },
  { days: '180 Days', apy: '46% APY', multiplier: '2.2x Points' },
  { days: '365 Days', apy: '84% APY', multiplier: '3.5x Points' },
] as const;

export default function StakingPage() {
  const t = useTranslations('dashboard.staking');

  return (
    <main className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--tx)]">
            {t('title')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--mut)]">
            Lock $OKN to earn yield and boost your ecosystem multiplier.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7A12F5]/40 bg-[#7A12F5]/15 px-3.5 py-1.5 text-xs font-extrabold text-[#C9A6FF]">
          <Clock className="size-3.5" />
          <span>Coming Soon</span>
        </span>
      </div>

      {/* Main Coming Soon Space */}
      <section className="relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-6 sm:p-10 md:p-14 text-center shadow-sm">
        <div className="mx-auto max-w-2xl space-y-5 relative z-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl border border-[#7A12F5]/35 bg-[#7A12F5]/15 text-[#C9A6FF] shadow-[0_8px_28px_rgba(122,18,245,0.25)]">
            <Lock className="size-7 stroke-[2.2]" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FFD60A]/35 bg-[#FFD60A]/12 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#FFD60A]">
            <Sparkles className="size-3.5" />
            <span>Coming Soon</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--tx)]">
            $OKN Staking Vaults — Coming Soon
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-[var(--mut)] leading-relaxed max-w-xl mx-auto">
            Time-locked $OKN staking vaults with up to <strong className="text-[#2FBD8E] font-extrabold">84% APY</strong> and{' '}
            <strong className="text-[var(--tx)] font-extrabold">3.5x OK Points multipliers</strong> are currently in final smart-contract audit and will open shortly.
          </p>

          {/* Planned Lock Tiers Preview */}
          <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            {PLANNED_TIERS.map((tier) => (
              <div
                key={tier.days}
                className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 flex flex-col justify-between gap-1.5"
              >
                <div className="text-xs font-bold text-[var(--mut)] whitespace-nowrap">
                  {tier.days}
                </div>
                <div className="num text-base sm:text-lg font-extrabold text-[#2FBD8E] whitespace-nowrap">
                  {tier.apy}
                </div>
                <div className="text-[11px] font-extrabold text-[#C9A6FF] whitespace-nowrap">
                  {tier.multiplier}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app/buy"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#7A12F5] px-6 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-[#7A12F5]/25 hover:bg-[#8C38F7] transition-all"
            >
              Accumulate $OKN in Presale
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
            <span>Non-custodial BEP-20 vault · Zero early-unlock principal slashing</span>
          </div>
        </div>

        {/* Ambient lighting */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 size-80 rounded-full bg-[#7A12F5]/12 blur-3xl" />
      </section>
    </main>
  );
}
