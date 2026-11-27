'use client';

import { useMemo } from 'react';
import { TransactionHistory } from '@/components/dashboard/transaction-history';
import {
  ACTIVITY_TRANSACTIONS,
  summarizeTransactions,
} from '@/lib/activity-transactions';

export function ActivityLogView() {
  const summary = useMemo(
    () => summarizeTransactions(ACTIVITY_TRANSACTIONS),
    [],
  );

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Audit Trail & Transaction Summary Hero Banner */}
      <section className="relative overflow-hidden rounded-[24px] md:rounded-[28px] bg-gradient-to-br from-[#6D0EE2] via-[#7A12F5] to-[#9333EA] p-5 sm:p-6 md:p-8 text-white shadow-[0_14px_36px_rgba(122,18,245,0.24)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-white/[0.08] blur-2xl"
        />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-white/80">
              Account Ledger
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Activity &amp; Transactions
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-white/80 max-w-md">
              Verified on-chain purchases, BNB referral payouts, staking deposits, and OK Points rewards.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/12 px-3.5 py-2.5 backdrop-blur-md">
              <div className="text-[11px] font-medium text-white/80">Total</div>
              <div className="num mt-0.5 text-lg font-extrabold text-white tabular-nums">
                {summary.total}
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/12 px-3.5 py-2.5 backdrop-blur-md">
              <div className="text-[11px] font-medium text-white/80">On-chain</div>
              <div className="num mt-0.5 text-lg font-extrabold text-white tabular-nums">
                {summary.onChainCount}
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/12 px-3.5 py-2.5 backdrop-blur-md">
              <div className="text-[11px] font-medium text-white/80">Pending</div>
              <div className="num mt-0.5 text-lg font-extrabold text-white tabular-nums">
                {summary.awaitingCommit}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full Interactive Transaction History */}
      <TransactionHistory embedded heading="Transaction history" />
    </div>
  );
}
