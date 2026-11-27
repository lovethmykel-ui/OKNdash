export type TransactionAssetFilter = 'All' | 'OK Points' | '$OKN' | 'BNB';

export type TransactionCategory =
  | 'presale'
  | 'referral'
  | 'staking'
  | 'task'
  | 'checkin'
  | 'claim';

export type TransactionStatus = 'Confirmed' | 'Awaiting commit' | 'Processing';

export interface ActivityTransaction {
  id: string;
  title: string;
  subtitle: string;
  category: TransactionCategory;
  date: string;
  asset: 'OK Points' | '$OKN' | 'BNB';
  amount: string;
  fiatValue?: string;
  status: TransactionStatus;
  direction: 'in' | 'out';
  txHash?: string;
}

export const ACTIVITY_TRANSACTIONS: readonly ActivityTransaction[] = [
  {
    id: 'tx-presale-1',
    title: 'Stage 1 Presale Buy',
    subtitle: '1.00 BNB @ $0.05 / $OKN',
    category: 'presale',
    date: 'Nov 2, 2026',
    asset: '$OKN',
    amount: '+12,000 $OKN',
    fiatValue: '$600.00',
    status: 'Confirmed',
    direction: 'in',
    txHash: '0x8f4e91c2b7a0d413e9c820fa39a1b61d22f0c3a4',
  },
  {
    id: 'tx-checkin-6',
    title: 'Daily check-in',
    subtitle: 'Day 6 of streak',
    category: 'checkin',
    date: 'Nov 2, 2026',
    asset: 'OK Points',
    amount: '+20 pts',
    status: 'Awaiting commit',
    direction: 'in',
  },
  {
    id: 'tx-ref-1',
    title: 'Partner Referral Payout',
    subtitle: 'Tier 1 · 12.5% instant commission',
    category: 'referral',
    date: 'Nov 1, 2026',
    asset: 'BNB',
    amount: '+0.085 BNB',
    fiatValue: '$51.00',
    status: 'Confirmed',
    direction: 'in',
    txHash: '0x3b12d84f60c5a971e2b4031fa98d702c41e6b891',
  },
  {
    id: 'tx-checkin-5',
    title: 'Daily check-in',
    subtitle: 'Day 5 of streak',
    category: 'checkin',
    date: 'Nov 1, 2026',
    asset: 'OK Points',
    amount: '+20 pts',
    status: 'Awaiting commit',
    direction: 'in',
  },
  {
    id: 'tx-stake-1',
    title: 'Staking Vault Deposit',
    subtitle: '90-day flexible vault · 24% APY',
    category: 'staking',
    date: 'Oct 31, 2026',
    asset: '$OKN',
    amount: '25,000 $OKN',
    fiatValue: '$1,250.00',
    status: 'Confirmed',
    direction: 'out',
    txHash: '0x9a20c45d18e3b762f5a1904cd83e12f6a0b7492e',
  },
  {
    id: 'tx-task-x',
    title: 'Follow $OKN on X',
    subtitle: 'Verified social task reward',
    category: 'task',
    date: 'Oct 31, 2026',
    asset: 'OK Points',
    amount: '+70 pts',
    status: 'Confirmed',
    direction: 'in',
  },
  {
    id: 'tx-checkin-4',
    title: 'Daily check-in',
    subtitle: 'Day 4 of streak',
    category: 'checkin',
    date: 'Oct 31, 2026',
    asset: 'OK Points',
    amount: '+20 pts',
    status: 'Awaiting commit',
    direction: 'in',
  },
  {
    id: 'tx-ref-2',
    title: 'Partner Referral Payout',
    subtitle: 'Tier 1 & Tier 2 batch settlement',
    category: 'referral',
    date: 'Oct 30, 2026',
    asset: 'BNB',
    amount: '+0.153 BNB',
    fiatValue: '$91.50',
    status: 'Confirmed',
    direction: 'in',
    txHash: '0x5c71e80b49d2a136f8c0429be17a53d902f4c188',
  },
  {
    id: 'tx-task-tg',
    title: 'Join OKN Telegram',
    subtitle: 'Verified community task reward',
    category: 'task',
    date: 'Oct 30, 2026',
    asset: 'OK Points',
    amount: '+50 pts',
    status: 'Confirmed',
    direction: 'in',
  },
  {
    id: 'tx-checkin-3',
    title: 'Daily check-in',
    subtitle: 'Day 3 of streak',
    category: 'checkin',
    date: 'Oct 30, 2026',
    asset: 'OK Points',
    amount: '+20 pts',
    status: 'Awaiting commit',
    direction: 'in',
  },
];

export function filterActivityTransactions(
  items: readonly ActivityTransaction[],
  assetFilter: TransactionAssetFilter,
  query = '',
): ActivityTransaction[] {
  const normalized = query.trim().toLowerCase();

  return items.filter((tx) => {
    const matchesAsset = assetFilter === 'All' || tx.asset === assetFilter;
    if (!matchesAsset) return false;
    if (!normalized) return true;

    return (
      tx.title.toLowerCase().includes(normalized) ||
      tx.subtitle.toLowerCase().includes(normalized) ||
      tx.asset.toLowerCase().includes(normalized) ||
      tx.status.toLowerCase().includes(normalized) ||
      (tx.txHash ? tx.txHash.toLowerCase().includes(normalized) : false)
    );
  });
}

export function summarizeTransactions(items: readonly ActivityTransaction[]): {
  total: number;
  confirmed: number;
  awaitingCommit: number;
  onChainCount: number;
} {
  let confirmed = 0;
  let awaitingCommit = 0;
  let onChainCount = 0;

  for (const tx of items) {
    if (tx.status === 'Confirmed') confirmed += 1;
    if (tx.status === 'Awaiting commit') awaitingCommit += 1;
    if (tx.txHash) onChainCount += 1;
  }

  return {
    total: items.length,
    confirmed,
    awaitingCommit,
    onChainCount,
  };
}

export function shortenTxHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}
