'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Coins,
  Copy,
  Gift,
  Lock,
  Search,
  Share2,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { openShareCard } from '@/components/share/share-card-modal';
import {
  ACTIVITY_TRANSACTIONS,
  filterActivityTransactions,
  shortenTxHash,
  type ActivityTransaction,
  type TransactionAssetFilter,
  type TransactionCategory,
} from '@/lib/activity-transactions';
import { cn } from '@/lib/utils';

const ASSET_FILTERS: readonly TransactionAssetFilter[] = [
  'All',
  'OK Points',
  '$OKN',
  'BNB',
];

function categoryMeta(category: TransactionCategory) {
  switch (category) {
    case 'presale':
      return {
        icon: ShoppingBag,
        surface:
          'bg-[#7A12F5]/12 text-[#7A12F5] dark:bg-[#7A12F5]/22 dark:text-[#C9A6FF]',
      };
    case 'referral':
      return {
        icon: Users,
        surface:
          'bg-amber-500/12 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
      };
    case 'staking':
      return {
        icon: Lock,
        surface:
          'bg-indigo-500/12 text-indigo-600 dark:bg-indigo-400/18 dark:text-indigo-300',
      };
    case 'task':
      return {
        icon: Gift,
        surface:
          'bg-fuchsia-500/12 text-fuchsia-600 dark:bg-fuchsia-400/18 dark:text-fuchsia-300',
      };
    case 'claim':
      return {
        icon: Coins,
        surface:
          'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300',
      };
    case 'checkin':
    default:
      return {
        icon: Check,
        surface:
          'bg-[#2FBD8E]/14 text-[#169C72] dark:bg-[#2FBD8E]/16 dark:text-[#34D399]',
      };
  }
}

function statusTone(status: ActivityTransaction['status']) {
  if (status === 'Confirmed') {
    return 'text-[#169C72] dark:text-[#34D399]';
  }
  if (status === 'Processing') {
    return 'text-[#7A12F5] dark:text-[#C9A6FF]';
  }
  return 'text-amber-600 dark:text-amber-400';
}

interface TransactionHistoryProps {
  /** Removes outer top margin when rendered directly inside ActivityLogView. */
  embedded?: boolean;
  /** Optional custom heading override. */
  heading?: string;
}

export function TransactionHistory({
  embedded = false,
  heading = 'Transaction history',
}: TransactionHistoryProps) {
  const [filter, setFilter] = useState<TransactionAssetFilter>('All');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterActivityTransactions(ACTIVITY_TRANSACTIONS, filter, query),
    [filter, query],
  );

  const handleCopyHash = (tx: ActivityTransaction) => {
    if (!tx.txHash) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(tx.txHash);
    }
    setCopiedId(tx.id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === tx.id ? null : prev));
    }, 1500);
  };

  const handleShareTransaction = (tx: ActivityTransaction) => {
    openShareCard(tx.category === 'referral' ? 'referrals' : 'portfolio', 'button', {
      badgeLabel: tx.asset,
      headlineValue: tx.amount,
      deltaLabel: `${tx.title} · ${tx.status}`,
      subMetrics: [
        { label: 'Activity', value: tx.title },
        { label: 'Value', value: tx.fiatValue ?? tx.asset, tone: 'emerald' },
        { label: 'Date', value: tx.date, tone: 'purple' },
      ],
      shareSummary: `${tx.title} on OKNexus: ${tx.amount}${tx.fiatValue ? ` (${tx.fiatValue})` : ''} — ${tx.status}!`,
    });
  };

  return (
    <section
      data-testid="transaction-history-section"
      className={cn(
        'rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-5 md:p-6 shadow-sm',
        embedded ? 'mt-0' : 'mt-7',
      )}
    >
      {/* Header + Controls */}
      <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between mb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
              {heading}
            </h3>
            <span className="num text-xs font-semibold text-[var(--mut)] tabular-nums">
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            </span>
            <button
              type="button"
              onClick={() =>
                openShareCard('portfolio', 'button', {
                  badgeLabel: filter === 'All' ? 'OKN Activity' : `${filter} Activity`,
                  headlineValue: `${filtered.length} Transactions`,
                  deltaLabel: 'Verified OKNexus Ledger Activity',
                  shareSummary: `Tracking ${filtered.length} verified ${filter === 'All' ? 'ecosystem' : filter} transactions on OKNexus!`,
                })
              }
              data-testid="transaction-history-share-btn"
              aria-label="Share transaction history"
              className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-[var(--s2)] px-2.5 text-[11px] font-bold text-[var(--tx)] ring-1 ring-inset ring-[var(--line)] hover:ring-[#7A12F5]/50 hover:text-[#7A12F5] dark:hover:text-[#C9A6FF] transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Share2 className="size-3 shrink-0" />
              <span>Share</span>
            </button>
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--mut)]">
            Presale buys, BNB payouts, staking, tasks, and OK Points movements.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--mut)]"
            />
            <input
              type="search"
              autoComplete="off"
              suppressHydrationWarning
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hash or type..."
              aria-label="Search transactions"
              className="h-9 w-full sm:w-48 rounded-xl border border-[var(--line)] bg-[var(--s2)] pl-8 pr-3 text-xs font-medium text-[var(--tx)] placeholder:text-[var(--mut)] focus:border-[#7A12F5] focus:outline-none focus:ring-2 focus:ring-[#7A12F5]/20 transition-colors"
            />
          </div>

          {/* Segmented Asset Filter */}
          <div
            role="tablist"
            aria-label="Filter transactions by asset"
            className="inline-flex items-center rounded-xl border border-[var(--line)] bg-[var(--s2)] p-1 gap-0.5 overflow-x-auto"
          >
            {ASSET_FILTERS.map((tab) => {
              const active = filter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab)}
                  className={cn(
                    'rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer',
                    active
                      ? 'bg-[#7A12F5] text-white shadow-[0_2px_8px_rgba(122,18,245,0.35)]'
                      : 'text-[var(--mut)] hover:text-[var(--tx)]',
                  )}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--s2)]/50 px-6 py-10 text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#7A12F5]/10 text-[#7A12F5] dark:bg-[#7A12F5]/20 dark:text-[#C9A6FF]">
            <Coins className="size-5" />
          </div>
          <p className="text-sm font-extrabold text-[var(--tx)]">
            No matching transactions
          </p>
          <p className="mt-1 max-w-xs text-xs text-[var(--mut)]">
            Try clearing your search or switching back to all assets.
          </p>
          {(filter !== 'All' || query.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilter('All');
                setQuery('');
              }}
              className="mt-4 rounded-xl bg-[#7A12F5] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#6A0EDB] transition-colors cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile List Layout (< md) */}
          <div className="divide-y divide-[var(--line)]/70 md:hidden">
            {filtered.map((row) => {
              const meta = categoryMeta(row.category);
              const Icon = meta.icon;
              return (
                <div
                  key={row.id}
                  data-testid="transaction-row-mobile"
                  className="flex items-start justify-between gap-3 py-3.5 first:pt-1 last:pb-1"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={cn(
                        'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
                        meta.surface,
                      )}
                    >
                      <Icon className="size-4 stroke-[2.2]" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-extrabold text-[var(--tx)]">
                        {row.title}
                      </p>
                      <p className="truncate text-[11px] font-medium text-[var(--mut)] mt-0.5">
                        {row.subtitle}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium text-[var(--mut)]">
                        <span>{row.date}</span>
                        <span aria-hidden="true">·</span>
                        <span className={cn('font-semibold', statusTone(row.status))}>
                          {row.status}
                        </span>
                      </div>
                      {row.txHash && (
                        <button
                          type="button"
                          onClick={() => handleCopyHash(row)}
                          className="mt-1 inline-flex items-center gap-1 font-mono text-[10.5px] text-[#7A12F5] dark:text-[#C9A6FF] hover:underline cursor-pointer"
                          aria-label={`Copy transaction hash ${row.txHash}`}
                        >
                          {copiedId === row.id ? 'Copied' : shortenTxHash(row.txHash)}
                          <Copy className="size-2.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
                    <div>
                      <p
                        className={cn(
                          'num text-[13px] font-extrabold tabular-nums whitespace-nowrap',
                          row.direction === 'in'
                            ? 'text-[#169C72] dark:text-[#34D399]'
                            : 'text-[var(--tx)]',
                        )}
                      >
                        {row.amount}
                      </p>
                      <p className="mt-0.5 num text-[11px] font-semibold text-[var(--mut)] tabular-nums">
                        {row.fiatValue ?? row.asset}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleShareTransaction(row)}
                      data-testid="transaction-row-share-btn"
                      aria-label={`Share ${row.title}`}
                      className="inline-flex h-6 items-center justify-center gap-1 rounded-md bg-[var(--s2)] px-2 text-[10px] font-bold text-[var(--tx)] ring-1 ring-inset ring-[var(--line)] hover:text-[#7A12F5] dark:hover:text-[#C9A6FF] cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Share2 className="size-2.5 shrink-0" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Tabular Ledger (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">
                  <th className="py-3 pr-4 pl-1">Transaction</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Status</th>
                  <th className="py-3 pl-4 pr-1 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]/50">
                {filtered.map((row) => {
                  const meta = categoryMeta(row.category);
                  const Icon = meta.icon;
                  return (
                    <tr
                      key={row.id}
                      data-testid="transaction-row-desktop"
                      className="transition-colors hover:bg-[#7A12F5]/[0.03] dark:hover:bg-[#7A12F5]/[0.07]"
                    >
                      <td className="py-3.5 pr-4 pl-1">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex size-9 shrink-0 items-center justify-center rounded-xl',
                              meta.surface,
                            )}
                          >
                            <Icon className="size-4 stroke-[2.2]" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-bold text-[var(--tx)]">
                              <span>{row.title}</span>
                              {row.direction === 'in' ? (
                                <ArrowDownLeft className="size-3.5 text-[#169C72] dark:text-[#34D399]" />
                              ) : (
                                <ArrowUpRight className="size-3.5 text-[#7A12F5] dark:text-[#C9A6FF]" />
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--mut)]">
                              <span>{row.subtitle}</span>
                              {row.txHash && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyHash(row)}
                                    className="inline-flex items-center gap-1 font-mono text-[11px] text-[#7A12F5] dark:text-[#C9A6FF] hover:underline cursor-pointer"
                                    aria-label={`Copy transaction hash ${row.txHash}`}
                                  >
                                    {copiedId === row.id ? 'Copied' : shortenTxHash(row.txHash)}
                                    <Copy className="size-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[var(--mut)] whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[var(--tx)] whitespace-nowrap">
                        {row.asset}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div
                          className={cn(
                            'num font-extrabold tabular-nums',
                            row.direction === 'in'
                              ? 'text-[#169C72] dark:text-[#34D399]'
                              : 'text-[var(--tx)]',
                          )}
                        >
                          {row.amount}
                        </div>
                        {row.fiatValue && (
                          <div className="num text-[11px] font-medium text-[var(--mut)] tabular-nums">
                            {row.fiatValue}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className={cn('text-xs font-bold', statusTone(row.status))}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 pr-1 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleShareTransaction(row)}
                          data-testid="transaction-row-share-btn"
                          aria-label={`Share ${row.title}`}
                          className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-[var(--s2)] px-2.5 text-[11px] font-bold text-[var(--tx)] ring-1 ring-inset ring-[var(--line)] hover:ring-[#7A12F5]/50 hover:text-[#7A12F5] dark:hover:text-[#C9A6FF] active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Share2 className="size-3 shrink-0" />
                          <span>Share</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
