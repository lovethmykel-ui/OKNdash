'use client';

/**
 * /app/wallet — Flagship Web3 & Fintech Custody Wallet Dashboard.
 *
 * Integrated with the portfolio segmented control:
 *   Overview -> /app/portfolio
 *   Activity -> /app/portfolio?tab=activity
 *   Holdings (Active) -> /app/wallet
 */
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/i18n/navigation';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Coins,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Gift,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { useOknBalance } from '@/lib/hooks/use-wallet';
import { useClaimEligibility } from '@/lib/hooks/use-claim';
import { useMe } from '@/lib/hooks/use-me';
import { api } from '@/lib/api/client';
import { AnimatePresence, motion } from 'motion/react';
import { OknWatermark } from '@/components/ui/okn-watermark';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import { formatPoints, formatWei } from '@/lib/utils';
import { toast } from 'sonner';

type AssetFilter = 'all' | 'onchain' | 'rewards';
type DepositNetwork = 'BEP-20 (BSC)' | 'TRC-20 (Tron)' | 'ERC-20 (Ethereum)';
type WithdrawAssetKey = 'BNB' | 'OKN' | 'USDT';

interface VaultActivityItem {
  id: string;
  type: 'deposit' | 'presale' | 'commission' | 'withdraw';
  title: string;
  subtitle: string;
  amountLabel: string;
  usdLabel: string;
  positive: boolean;
  timeAgo: string;
  txShort: string;
}

const INITIAL_VAULT_ACTIVITY: VaultActivityItem[] = [
  {
    id: 'va-1',
    type: 'presale',
    title: 'Stage 2 Presale Allocation',
    subtitle: 'Instant custody credit · BEP-20',
    amountLabel: '+416,666 $OKN',
    usdLabel: '$250.00',
    positive: true,
    timeAgo: '1h ago',
    txShort: '0x94e1...3b08',
  },
  {
    id: 'va-2',
    type: 'commission',
    title: 'Partner Commission Payout',
    subtitle: 'L1 Referral (@alex_web3)',
    amountLabel: '+0.048 BNB',
    usdLabel: '+$28.50',
    positive: true,
    timeAgo: '2h ago',
    txShort: '0x71c4...9a21',
  },
  {
    id: 'va-3',
    type: 'deposit',
    title: 'BNB On-Chain Deposit',
    subtitle: 'BNB Smart Chain · Confirmed',
    amountLabel: '+1.45 BNB',
    usdLabel: '$870.00',
    positive: true,
    timeAgo: '1d ago',
    txShort: '0x38a9...7c14',
  },
  {
    id: 'va-4',
    type: 'commission',
    title: 'Partner Commission Payout',
    subtitle: 'L1 Referral (@nina_eth)',
    amountLabel: '+0.037 BNB',
    usdLabel: '+$22.00',
    positive: true,
    timeAgo: '1d ago',
    txShort: '0x52d0...1e66',
  },
];

export default function WalletPage() {
  const hydrated = useHydrated();
  const { address } = useAccount();
  const qc = useQueryClient();
  const me = useMe();
  const oknBalance = useOknBalance();
  const eligibility = useClaimEligibility();

  const [hideBalance, setHideBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [switchingWallet, setSwitchingWallet] = useState(false);
  const [assetFilter, setAssetFilter] = useState<AssetFilter>('all');

  // Deposit Modal State
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositNetwork, setDepositNetwork] = useState<DepositNetwork>('BEP-20 (BSC)');

  // Withdraw Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAsset, setWithdrawAsset] = useState<WithdrawAssetKey>('BNB');
  const [withdrawReceipt, setWithdrawReceipt] = useState<{
    amount: number;
    asset: WithdrawAssetKey;
    recipient: string;
    txHash: string;
  } | null>(null);

  // Recent Vault Activity State
  const [activityList, setActivityList] = useState<VaultActivityItem[]>(INITIAL_VAULT_ACTIVITY);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('okn_hide_balance') === 'true';
      setHideBalance(stored);
    } catch {}
  }, []);

  const toggleBalance = () => {
    setHideBalance((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('okn_hide_balance', next ? 'true' : 'false');
      } catch {}
      return next;
    });
  };

  const points = eligibility.data?.points ?? 135;
  const currentAddress =
    address || me.data?.user?.walletAddress || '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377';
  const displayAddress = `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}`;
  const oknNumeric = useMemo(() => {
    if (oknBalance.data != null) {
      const formatted = formatWei(oknBalance.data).replace(/,/g, '');
      const parsed = Number(formatted);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 693333;
    }
    return 693333;
  }, [oknBalance.data]);

  const oknDisplay =
    oknBalance.data != null ? `${formatWei(oknBalance.data)} $OKN` : '693,333 $OKN';

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(currentAddress);
      setCopied(true);
      toast.success('Wallet address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      toast.info('Wallet address selected');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSwitchDemoWallet = async () => {
    setSwitchingWallet(true);
    try {
      const res = await api.cycleDemoWallet();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['me'] }),
        qc.invalidateQueries({ queryKey: ['demo-okn-balance'] }),
        qc.invalidateQueries({ queryKey: ['claim-eligibility'] }),
      ]);
      toast.success(
        `Switched vault wallet to ${res.walletAddress.slice(0, 6)}...${res.walletAddress.slice(-4)}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to switch demo wallet.');
    } finally {
      setSwitchingWallet(false);
    }
  };

  const maxForAsset: Record<WithdrawAssetKey, number> = {
    BNB: 1.45,
    OKN: oknNumeric,
    USDT: 142.5,
  };

  const applyPresetPercent = (pct: number) => {
    const maxVal = maxForAsset[withdrawAsset];
    const computed = maxVal * pct;
    setWithdrawAmount(
      withdrawAsset === 'OKN'
        ? String(Math.round(computed))
        : computed.toFixed(withdrawAsset === 'BNB' ? 3 : 2).replace(/\.?0+$/, ''),
    );
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAddr = withdrawAddress.trim() || currentAddress;
    if (!targetAddr.startsWith('0x') || targetAddr.length < 10) {
      toast.error('Please enter a valid 0x destination address');
      return;
    }
    const parsedAmt = parseFloat(withdrawAmount);
    if (Number.isNaN(parsedAmt) || parsedAmt <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }
    if (parsedAmt > maxForAsset[withdrawAsset]) {
      toast.error(`Amount exceeds available ${withdrawAsset} balance`);
      return;
    }

    const txShort = `0x${Math.floor(1000 + Math.random() * 9000).toString(16)}...${targetAddr.slice(-4)}`;
    const usdEst =
      withdrawAsset === 'BNB'
        ? `$${(parsedAmt * 600).toFixed(2)}`
        : withdrawAsset === 'OKN'
          ? `$${(parsedAmt * 0.0006).toFixed(2)}`
          : `$${parsedAmt.toFixed(2)}`;

    setActivityList((prev) => [
      {
        id: `va-${Date.now()}`,
        type: 'withdraw',
        title: `${withdrawAsset} Withdrawal Dispatched`,
        subtitle: `To ${targetAddr.slice(0, 6)}...${targetAddr.slice(-4)} · BEP-20`,
        amountLabel: `-${parsedAmt.toLocaleString('en-US')} ${withdrawAsset}`,
        usdLabel: usdEst,
        positive: false,
        timeAgo: 'Just now',
        txShort,
      },
      ...prev,
    ]);

    setWithdrawReceipt({
      amount: parsedAmt,
      asset: withdrawAsset,
      recipient: `${targetAddr.slice(0, 6)}...${targetAddr.slice(-4)}`,
      txHash: txShort,
    });
    setWithdrawAmount('');
    setWithdrawAddress('');
  };

  const assetRows = [
    {
      id: 'bnb',
      category: 'onchain' as const,
      name: 'BNB Smart Chain',
      subtitle: 'Native Gas & Settlement · BEP-20',
      badge: '+4.2% 24h',
      badgeTone: 'text-[#2FBD8E] bg-[#2FBD8E]/12 border-[#2FBD8E]/30',
      amount: '1.45 BNB',
      usd: '$870.00',
      sharePct: 60.9,
      dotColor: 'bg-[#F3BA2F]',
      iconBg: 'bg-[#F3BA2F]/15 border-[#F3BA2F]/30',
      imgSrc: '/bnb-logo.png',
      actionLabel: 'Deposit',
      onAction: () => setShowDepositModal(true),
    },
    {
      id: 'okn',
      category: 'onchain' as const,
      name: '$OKN Token',
      subtitle: 'Stage 2 Presale Allocation · 0% Tax',
      badge: 'Stage 2 · $0.0006',
      badgeTone: 'text-[#7A12F5] dark:text-[#C9A6FF] bg-[#7A12F5]/12 border-[#7A12F5]/30',
      amount: oknDisplay,
      usd: '$416.00',
      sharePct: 29.1,
      dotColor: 'bg-[#7A12F5]',
      iconBg: 'bg-[#7A12F5]/15 border-[#7A12F5]/30',
      imgSrc: '/okn-logo.png',
      actionHref: '/app/buy',
      actionLabel: 'Buy More',
    },
    {
      id: 'partner',
      category: 'rewards' as const,
      name: 'Partner Commission Vault',
      subtitle: '14 Active Referrals · Instant BNB/USDT',
      badge: '12.5% Tier 2',
      badgeTone: 'text-[#2FBD8E] bg-[#2FBD8E]/12 border-[#2FBD8E]/30',
      amount: '0.238 BNB',
      usd: '$142.50',
      sharePct: 10.0,
      dotColor: 'bg-[#2FBD8E]',
      iconBg: 'bg-[#2FBD8E]/15 border-[#2FBD8E]/30',
      iconType: 'users' as const,
      actionLabel: 'Withdraw',
      onAction: () => {
        setWithdrawAsset('USDT');
        setWithdrawReceipt(null);
        setShowWithdrawModal(true);
      },
    },
    {
      id: 'points',
      category: 'rewards' as const,
      name: 'OK Points Balance',
      subtitle: 'Cryptographic Merkle Claim · 1:1 $OKN',
      badge: 'Claim Ready',
      badgeTone: 'text-[#09B4FF] bg-[#09B4FF]/12 border-[#09B4FF]/30',
      amount: `${formatPoints(points)} Pts`,
      usd: '250,000 $OKN Pool',
      sharePct: 0,
      dotColor: 'bg-[#09B4FF]',
      iconBg: 'bg-[#09B4FF]/15 border-[#09B4FF]/30',
      iconType: 'coins' as const,
      actionHref: '/app/claim',
      actionLabel: 'Claim',
    },
  ];

  const visibleAssets = assetRows.filter((row) =>
    assetFilter === 'all' ? true : row.category === assetFilter,
  );

  return (
    <main className="space-y-5 pb-12">
      {/* Error Alert Banner if balance/profile query fails */}
      {(me.isError || eligibility.isError) && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-500"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Unable to sync live on-chain telemetry. Displaying verified vault snapshot.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              void me.refetch();
              void eligibility.refetch();
              void oknBalance.refetch();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 px-3 py-1.5 font-extrabold text-rose-500 hover:bg-rose-500/30 transition-colors cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Mobile Segmented Switcher */}
      <div className="block md:hidden">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[var(--s2)] border border-[var(--line)] shadow-xs">
          <Link
            href="/app/portfolio"
            className="flex items-center justify-center py-2.5 px-2 rounded-xl text-xs font-extrabold text-[var(--mut)] hover:text-[var(--tx)] active:scale-95 transition-all cursor-pointer"
          >
            Overview
          </Link>
          <Link
            href="/app/portfolio?tab=activity"
            className="flex items-center justify-center py-2.5 px-2 rounded-xl text-xs font-extrabold text-[var(--mut)] hover:text-[var(--tx)] active:scale-95 transition-all cursor-pointer"
          >
            Activity
          </Link>
          <span className="flex items-center justify-center py-2.5 px-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#7A12F5] to-[#8C38F7] text-white shadow-[0_2px_12px_rgba(122,18,245,0.45)] cursor-default">
            Holdings
          </span>
        </div>
      </div>

      {/* Desktop Header with integrated switcher */}
      <div className="hidden md:flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--tx)] md:text-3xl">
            Wallet &amp; Custody Vault
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--mut)]">
            Manage your $OKN allocations, on-chain BNB balances, and instant partner payouts.
          </p>
        </div>
        <div className="inline-flex items-center rounded-xl border border-[var(--line)] bg-[var(--s2)] p-1 gap-1">
          <Link
            href="/app/portfolio"
            className="rounded-lg px-4 py-1.5 text-xs font-bold text-[var(--mut)] hover:text-[var(--tx)] transition-all cursor-pointer"
          >
            Overview
          </Link>
          <Link
            href="/app/portfolio?tab=activity"
            className="rounded-lg px-4 py-1.5 text-xs font-bold text-[var(--mut)] hover:text-[var(--tx)] transition-all cursor-pointer"
          >
            Activity
          </Link>
          <span className="rounded-lg px-4 py-1.5 text-xs font-bold bg-[#7A12F5] text-white shadow-[0_2px_8px_rgba(122,18,245,0.35)] cursor-default">
            Holdings
          </span>
        </div>
      </div>

      {/* 1. Flagship Purple Gradient Custody Vault Hero Card */}
      <section className="relative overflow-hidden rounded-[26px] sm:rounded-[28px] bg-gradient-to-br from-[#7A12F5] via-[#6D0ED8] to-[#4A05A3] p-5 sm:p-7 text-white shadow-xl">
        <OknWatermark variant="hero" size="lg" />

        {/* Top Row: Vault Status Pill + Eye Toggle on Left, Copyable Wallet + Switch on Right */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-white backdrop-blur-sm">
              <span className="size-2 rounded-full bg-[#34D399] animate-pulse" />
              <span>BSC Custody Vault</span>
            </span>
            <button
              type="button"
              onClick={toggleBalance}
              className="flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white/90 hover:bg-white/25 transition-colors cursor-pointer"
              aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
            >
              {hideBalance ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>

          {/* Copyable Wallet Pill + Switch Demo Wallet */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void copyAddress()}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-xs font-mono font-bold text-white hover:bg-black/35 transition-colors cursor-pointer backdrop-blur-md"
              title="Copy wallet address"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="copied"
                    initial={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-1 text-[#34D399] font-sans font-extrabold"
                  >
                    <Check className="size-3.5 stroke-[2.8]" />
                    <span>✔️ Copied</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="addr"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-1.5"
                  >
                    <span>{displayAddress}</span>
                    <Copy className="size-3 text-purple-200/80" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              type="button"
              onClick={() => void handleSwitchDemoWallet()}
              disabled={switchingWallet}
              title="Switch Demo Wallet"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-white hover:text-[#5B0AC2] transition-all cursor-pointer whitespace-nowrap backdrop-blur-md"
            >
              <RefreshCw className={`size-3 ${switchingWallet ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Switch Wallet</span>
              <span className="sm:hidden">Switch</span>
            </button>
          </div>
        </div>

        {/* Center Row: Primary Net Asset Valuation with Soft-Blur Counter */}
        <div className="relative z-10 mt-5">
          <div className="text-xs font-bold uppercase tracking-wider text-purple-200/90">
            Total Net Asset Value
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            {hideBalance ? (
              <span className="num text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight tabular-nums">
                ••••••••
              </span>
            ) : (
              <span className="num text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight tabular-nums">
                $<AnimatedCounter target={1428} durationMs={950} />.50
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/40 bg-[#10B981]/25 px-2.5 py-0.5 text-xs font-extrabold text-[#6EE7B7] tabular-nums backdrop-blur-sm">
              +$142.50 (+11.1% 24h)
            </span>
          </div>
          <div className="mt-1.5 text-xs font-semibold text-purple-100/85">
            {hideBalance ? '•••• BNB Equivalent' : '≈ 2.38 BNB Total Portfolio Value · 100% On-Chain Backed'}
          </div>
        </div>

        {/* Bottom Row: 4-Action Glassmorphic Dock */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/15 grid grid-cols-4 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowDepositModal(true)}
            className="group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-white/20 bg-white/12 py-2.5 sm:py-3 px-2 text-xs font-extrabold text-white hover:bg-white/22 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
          >
            <span className="flex size-8 sm:size-7 items-center justify-center rounded-xl bg-[#38BDF8]/25 text-[#7DD3FC] group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="size-4 stroke-[2.5]" />
            </span>
            <span className="text-[11px] sm:text-xs whitespace-nowrap">Deposit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWithdrawReceipt(null);
              setShowWithdrawModal(true);
            }}
            className="group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-white/20 bg-white/12 py-2.5 sm:py-3 px-2 text-xs font-extrabold text-white hover:bg-white/22 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
          >
            <span className="flex size-8 sm:size-7 items-center justify-center rounded-xl bg-[#FBBF24]/25 text-[#FDE68A] group-hover:scale-105 transition-transform">
              <ArrowUpRight className="size-4 stroke-[2.5]" />
            </span>
            <span className="text-[11px] sm:text-xs whitespace-nowrap">Withdraw</span>
          </button>

          <Link
            href="/app/buy"
            className="group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-white/30 bg-white text-[#5B0AC2] py-2.5 sm:py-3 px-2 text-xs font-extrabold shadow-md hover:bg-purple-50 active:scale-95 transition-all cursor-pointer"
          >
            <span className="flex size-8 sm:size-7 items-center justify-center rounded-xl bg-[#7A12F5]/15 text-[#7A12F5] group-hover:scale-105 transition-transform">
              <ShoppingCart className="size-4 stroke-[2.4]" />
            </span>
            <span className="text-[11px] sm:text-xs whitespace-nowrap">Buy $OKN</span>
          </Link>

          <Link
            href="/app/claim"
            className="group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-white/20 bg-white/12 py-2.5 sm:py-3 px-2 text-xs font-extrabold text-white hover:bg-white/22 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
          >
            <span className="flex size-8 sm:size-7 items-center justify-center rounded-xl bg-[#34D399]/25 text-[#6EE7B7] group-hover:scale-105 transition-transform">
              <Gift className="size-4 stroke-[2.3]" />
            </span>
            <span className="text-[11px] sm:text-xs whitespace-nowrap">Claim</span>
          </Link>
        </div>
      </section>

      {/* 2. 4-Column High-Contrast Account Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--mut)] truncate">Liquid On-Chain</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#F3BA2F]/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bnb-logo.png" alt="BNB" className="size-4.5 object-contain" />
            </span>
          </div>
          <div>
            <p className="num text-lg sm:text-xl font-extrabold text-[var(--tx)] tabular-nums">
              {hideBalance ? '••••••' : '$870.00'}
            </p>
            <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-[#D97706] dark:text-[#F3BA2F] truncate">
              1.45 BNB · Gas Ready
            </p>
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--mut)] truncate">Presale $OKN</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#7A12F5]/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/okn-logo.png" alt="$OKN" className="size-5 object-contain" />
            </span>
          </div>
          <div>
            <p className="num text-lg sm:text-xl font-extrabold text-[var(--tx)] tabular-nums">
              {hideBalance ? '••••••' : '$416.00'}
            </p>
            <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-[#7A12F5] dark:text-[#C9A6FF] truncate">
              {oknDisplay} Allocated
            </p>
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--mut)] truncate">Partner Vault</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#2FBD8E]/15 text-[#2FBD8E]">
              <Users className="size-4" />
            </span>
          </div>
          <div>
            <p className="num text-lg sm:text-xl font-extrabold text-[#2FBD8E] tabular-nums">
              {hideBalance ? '••••••' : '$142.50'}
            </p>
            <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-[var(--mut)] truncate">
              0.238 BNB · 14 Invites
            </p>
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--mut)] truncate">OK Points</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#09B4FF]/15 text-[#09B4FF]">
              <Coins className="size-4" />
            </span>
          </div>
          <div>
            <p className="num text-lg sm:text-xl font-extrabold text-[var(--tx)] tabular-nums">
              {formatPoints(points)} Pts
            </p>
            <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-[#09B4FF] truncate">
              Merkle Claim Ready
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Split: Asset Holdings Breakdown & Vault Activity + Custody Rails */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
        {/* Left Column (lg:col-span-7): Interactive Asset Holdings */}
        <section className="lg:col-span-7 rounded-[26px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
                Asset Holdings
              </h2>
              <p className="text-xs text-[var(--mut)] mt-0.5">
                On-chain tokens, presale allocations, and partner rewards
              </p>
            </div>

            {/* Single-line filter pills */}
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all' as const, label: 'All (4)' },
                { id: 'onchain' as const, label: 'On-Chain (2)' },
                { id: 'rewards' as const, label: 'Rewards (2)' },
              ].map((tab) => {
                const active = assetFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAssetFilter(tab.id)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#7A12F5] text-white shadow-xs'
                        : 'border border-[var(--line)] bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allocation Progress Bar + Legend */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 space-y-2.5">
            <div className="h-2.5 w-full rounded-full bg-[var(--line)] overflow-hidden flex gap-1 p-0.5">
              <div className="h-full rounded-full bg-[#F3BA2F]" style={{ width: '60.9%' }} />
              <div className="h-full rounded-full bg-[#7A12F5]" style={{ width: '29.1%' }} />
              <div className="h-full rounded-full bg-[#2FBD8E]" style={{ width: '10.0%' }} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-[var(--mut)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#F3BA2F]" />
                <span className="text-[var(--tx)]">BNB</span> 60.9%
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#7A12F5]" />
                <span className="text-[var(--tx)]">$OKN</span> 29.1%
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#2FBD8E]" />
                <span className="text-[var(--tx)]">Partner Vault</span> 10.0%
              </span>
            </div>
          </div>

          {/* Single-Row Asset Items */}
          <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--s2)] overflow-hidden">
            {visibleAssets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-4 hover:bg-[var(--s1)]/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-2xl border ${asset.iconBg}`}
                  >
                    {asset.imgSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.imgSrc} alt={asset.name} className="size-5.5 object-contain" />
                    ) : asset.iconType === 'users' ? (
                      <Users className="size-5 text-[#2FBD8E]" />
                    ) : (
                      <Coins className="size-5 text-[#09B4FF]" />
                    )}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-[var(--tx)] truncate">
                        {asset.name}
                      </span>
                      <span
                        className={`hidden sm:inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold ${asset.badgeTone}`}
                      >
                        {asset.badge}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium text-[var(--mut)] truncate">
                      {asset.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="num font-extrabold text-xs sm:text-sm text-[var(--tx)] tabular-nums">
                      {asset.amount}
                    </div>
                    <div className="text-[11px] font-bold text-[var(--mut)] tabular-nums mt-0.5">
                      {hideBalance && asset.usd.startsWith('$') ? '••••••' : asset.usd}
                    </div>
                  </div>

                  {asset.actionHref ? (
                    <Link
                      href={asset.actionHref as never}
                      className="hidden sm:inline-flex h-8 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s1)] px-3 text-xs font-extrabold text-[var(--tx)] hover:border-[#7A12F5] hover:text-[#7A12F5] dark:hover:text-[#C9A6FF] transition-colors cursor-pointer"
                    >
                      {asset.actionLabel}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={asset.onAction}
                      className="hidden sm:inline-flex h-8 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s1)] px-3 text-xs font-extrabold text-[var(--tx)] hover:border-[#7A12F5] hover:text-[#7A12F5] dark:hover:text-[#C9A6FF] transition-colors cursor-pointer"
                    >
                      {asset.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column (lg:col-span-5): Recent Vault Activity + Custody Rails */}
        <div className="lg:col-span-5 space-y-5">
          {/* Recent Vault Activity Card */}
          <section className="rounded-[26px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
                  Recent Vault Activity
                </h2>
                <p className="text-xs text-[var(--mut)] mt-0.5">
                  Latest on-chain settlements &amp; payouts
                </p>
              </div>
              <Link
                href="/app/portfolio?tab=activity"
                className="inline-flex items-center gap-1 text-xs font-extrabold text-[#7A12F5] dark:text-[#C9A6FF] hover:underline"
              >
                <span>Full Log</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>

            <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--s2)] overflow-hidden">
              {activityList.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-3 hover:bg-[var(--s1)]/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-xl border ${
                        item.positive
                          ? 'border-[#2FBD8E]/30 bg-[#2FBD8E]/15 text-[#2FBD8E]'
                          : 'border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#D97706] dark:text-[#F3BA2F]'
                      }`}
                    >
                      {item.positive ? (
                        <ArrowDownLeft className="size-4 stroke-[2.4]" />
                      ) : (
                        <ArrowUpRight className="size-4 stroke-[2.4]" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-[var(--tx)] truncate">
                        {item.title}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--mut)] truncate">
                        <span className="truncate">{item.subtitle}</span>
                        <span>·</span>
                        <span className="shrink-0">{item.timeAgo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`num text-xs font-extrabold tabular-nums ${
                        item.positive ? 'text-[#2FBD8E]' : 'text-[var(--tx)]'
                      }`}
                    >
                      {hideBalance ? '••••' : item.amountLabel}
                    </div>
                    <div className="num text-[11px] font-semibold text-[var(--mut)] mt-0.5">
                      {hideBalance ? '••••' : item.usdLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Custody & Payment Rails Card */}
          <section className="rounded-[26px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-[var(--tx)]">
                Custody &amp; Payment Rails
              </h2>
              <p className="mt-0.5 text-xs text-[var(--mut)]">
                Connected settlement gateways for your bound wallet
              </p>
            </div>

            <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-4 text-xs">
              <div className="flex items-center justify-between gap-3 py-3">
                <span className="font-semibold text-[var(--mut)]">Bound Address</span>
                <button
                  type="button"
                  onClick={() => void copyAddress()}
                  className="inline-flex items-center gap-1.5 font-mono font-bold text-[var(--tx)] hover:text-[#7A12F5] dark:hover:text-[#C9A6FF] transition-colors cursor-pointer"
                >
                  <span>{displayAddress}</span>
                  {copied ? (
                    <Check className="size-3.5 text-[#2FBD8E]" />
                  ) : (
                    <Copy className="size-3.5 text-[var(--mut)]" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 py-3">
                <span className="font-semibold text-[var(--mut)]">Primary Network</span>
                <span className="font-extrabold text-[var(--tx)]">BNB Smart Chain (BEP-20)</span>
              </div>

              <div className="flex items-center justify-between gap-3 py-3">
                <span className="font-semibold text-[var(--mut)]">Multi-Chain Deposit</span>
                <span className="font-extrabold text-[#09B4FF]">USDT · BTC · ETH · SOL · BNB</span>
              </div>

              <div className="flex items-center justify-between gap-3 py-3">
                <span className="font-semibold text-[var(--mut)]">Merkle Distributor</span>
                <span className="inline-flex items-center gap-1 font-extrabold text-[#2FBD8E]">
                  <Sparkles className="size-3" />
                  <span>Root v3 Verified</span>
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 flex items-start gap-3">
              <ShieldCheck className="size-5 text-[#2FBD8E] shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-[var(--mut)]">
                <span className="font-extrabold block text-[var(--tx)] mb-0.5">
                  Non-Custodial Merkle Verification
                </span>
                Your presale allocations and OK Points claims are cryptographically verified on BNB Smart Chain with zero lockup tax.
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Deposit Modal — Centered with Multi-Network Selector & Motion Blur */}
      {hydrated &&
        createPortal(
          <AnimatePresence>
            {showDepositModal && (
              <motion.div
                key="wallet-deposit-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                onClick={() => setShowDepositModal(false)}
              >
                <motion.div
                  key="wallet-deposit-dialog"
                  initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.94, y: 10, filter: 'blur(8px)' }}
                  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-[400px] rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.75)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">
                        Deposit to Custody Vault
                      </h3>
                      <p className="text-xs text-[var(--mut)] mt-0.5">
                        Instant credit after 1 network confirmation
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDepositModal(false)}
                      aria-label="Close deposit modal"
                      className="size-8 rounded-full bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)] flex items-center justify-center cursor-pointer"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Network Selector */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl border border-[var(--line)] bg-[var(--s2)] mb-4">
                    {(['BEP-20 (BSC)', 'TRC-20 (Tron)', 'ERC-20 (Ethereum)'] as const).map((net) => {
                      const active = depositNetwork === net;
                      return (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setDepositNetwork(net)}
                          className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer truncate ${
                            active
                              ? 'bg-[#7A12F5] text-white shadow-xs'
                              : 'text-[var(--mut)] hover:text-[var(--tx)]'
                          }`}
                        >
                          {net.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>

                  {/* White QR Container */}
                  <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white my-3 shadow-inner">
                    <QrCode className="size-32 text-[#0A0A0C]" strokeWidth={1.75} />
                    <span className="text-[11px] font-bold text-zinc-500 mt-2.5 uppercase tracking-[0.14em]">
                      SCAN ON {depositNetwork.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1.5 mt-4">
                    <label className="text-xs font-bold text-[var(--mut)]">
                      Vault Deposit Address ({depositNetwork})
                    </label>
                    <div className="flex items-center gap-2 p-2 pl-3.5 rounded-2xl border border-[var(--line)] bg-[var(--s2)]">
                      <span className="font-mono text-xs font-bold text-[var(--tx)] flex-1 truncate">
                        {currentAddress}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copyAddress()}
                        className="h-9 px-3.5 rounded-xl bg-[#7A12F5] text-white text-xs font-extrabold shadow-xs hover:bg-[#8C38F7] cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        <span>{copied ? '✔️ Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--mut)] mt-4 text-center">
                    Only send {depositNetwork} compatible assets to this address.
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Withdraw Modal — With Presets, Bound Wallet Fill & Motion-Blur Checkmark Confirmation */}
      {hydrated &&
        createPortal(
          <AnimatePresence>
            {showWithdrawModal && (
              <motion.div
                key="wallet-withdraw-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                onClick={() => setShowWithdrawModal(false)}
              >
                <motion.div
                  key="wallet-withdraw-dialog"
                  initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.94, y: 10, filter: 'blur(8px)' }}
                  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-[400px] rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.75)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {withdrawReceipt ? (
                    <div className="text-center py-2">
                      {/* Animated Motion-Blur Checkmark Circle */}
                      <div className="relative mx-auto flex size-20 items-center justify-center">
                        <motion.span
                          aria-hidden="true"
                          initial={{ scale: 0.5, opacity: 0.85, filter: 'blur(4px)' }}
                          animate={{ scale: 1.6, opacity: 0, filter: 'blur(14px)' }}
                          transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                          className="pointer-events-none absolute inset-1 rounded-full bg-[#10B981]/45"
                        />
                        <motion.div
                          initial={{ scale: 0.4, opacity: 0, filter: 'blur(10px)' }}
                          animate={{ scale: [0.4, 1.08, 1], opacity: 1, filter: 'blur(0px)' }}
                          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                          className="flex size-14 items-center justify-center rounded-full bg-[#10B981] text-white shadow-[0_0_28px_rgba(16,185,129,0.55)]"
                        >
                          <motion.svg
                            viewBox="0 0 24 24"
                            className="size-7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3.2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <motion.path
                              d="M5 13l4 4L19 7"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ delay: 0.16, duration: 0.34, ease: 'easeOut' }}
                            />
                          </motion.svg>
                        </motion.div>
                      </div>

                      <h3 className="mt-3 text-xl font-extrabold text-[var(--tx)]">
                        ✔️ Done · Withdrawal Sent
                      </h3>
                      <p className="mt-1 text-xs text-[var(--mut)]">
                        Dispatched on BNB Smart Chain (BEP-20)
                      </p>

                      <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--s2)] divide-y divide-[var(--line)] text-xs text-left">
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-[var(--mut)]">Amount</span>
                          <span className="font-extrabold text-[var(--tx)] num">
                            {withdrawReceipt.amount.toLocaleString('en-US')} {withdrawReceipt.asset}
                          </span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-[var(--mut)]">Recipient</span>
                          <span className="font-mono font-bold text-[var(--tx)]">
                            {withdrawReceipt.recipient}
                          </span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-[var(--mut)]">Transaction</span>
                          <span className="font-mono font-bold text-[#2FBD8E]">
                            {withdrawReceipt.txHash}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setWithdrawReceipt(null);
                          setShowWithdrawModal(false);
                        }}
                        className="mt-5 w-full h-11 rounded-xl bg-gradient-to-r from-[#7A12F5] to-[#8C38F7] text-white text-xs sm:text-sm font-extrabold shadow-md hover:brightness-110 transition-all cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">
                            Withdraw Funds
                          </h3>
                          <p className="text-xs text-[var(--mut)] mt-0.5">
                            Instant BEP-20 settlement to any wallet
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowWithdrawModal(false)}
                          aria-label="Close withdraw modal"
                          className="size-8 rounded-full bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)] flex items-center justify-center cursor-pointer"
                        >
                          <X className="size-4" />
                        </button>
                      </div>

                      <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-[var(--mut)] uppercase tracking-wider">
                            Select Asset
                          </label>
                          <div className="grid grid-cols-3 gap-2 mt-1.5">
                            {(
                              [
                                { id: 'BNB', label: 'BNB', sub: '1.45 Avail' },
                                { id: 'OKN', label: '$OKN', sub: '693K Avail' },
                                { id: 'USDT', label: 'USDT', sub: '$142.50' },
                              ] as const
                            ).map((item) => {
                              const active = withdrawAsset === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setWithdrawAsset(item.id);
                                    setWithdrawAmount('');
                                  }}
                                  className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                                    active
                                      ? 'border-[#7A12F5] bg-[#7A12F5]/15 text-[#7A12F5] dark:text-[#C9A6FF]'
                                      : 'border-[var(--line)] bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)]'
                                  }`}
                                >
                                  <div className="text-xs font-extrabold">{item.label}</div>
                                  <div className="text-[10px] font-semibold opacity-80">{item.sub}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--mut)] uppercase tracking-wider">
                              Recipient Address (BEP-20)
                            </label>
                            <button
                              type="button"
                              onClick={() => setWithdrawAddress(currentAddress)}
                              className="text-[11px] font-extrabold text-[#7A12F5] dark:text-[#C9A6FF] hover:underline cursor-pointer"
                            >
                              Use Bound Wallet
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder={currentAddress}
                            value={withdrawAddress}
                            onChange={(e) => setWithdrawAddress(e.target.value)}
                            className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-xs font-mono font-bold text-[var(--tx)] outline-none focus:border-[#7A12F5]"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--mut)] uppercase tracking-wider">
                              Amount ({withdrawAsset})
                            </label>
                            <div className="flex items-center gap-1">
                              {[
                                { label: '25%', pct: 0.25 },
                                { label: '50%', pct: 0.5 },
                                { label: 'MAX', pct: 1 },
                              ].map((chip) => (
                                <button
                                  key={chip.label}
                                  type="button"
                                  onClick={() => applyPresetPercent(chip.pct)}
                                  className="px-2 py-0.5 rounded-md border border-[var(--line)] bg-[var(--s2)] text-[10px] font-extrabold text-[var(--tx)] hover:border-[#7A12F5] cursor-pointer"
                                >
                                  {chip.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-sm font-extrabold text-[var(--tx)] outline-none focus:border-[#7A12F5] tabular-nums"
                          />
                        </div>

                        <div className="rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3.5 py-2.5 flex items-center justify-between text-xs">
                          <span className="text-[var(--mut)]">Network Gas Fee</span>
                          <span className="font-bold text-[#2FBD8E]">Sponsored (0.00 BNB)</span>
                        </div>

                        <button
                          type="submit"
                          className="w-full h-11 rounded-xl bg-gradient-to-r from-[#7A12F5] to-[#8C38F7] text-white text-xs sm:text-sm font-extrabold shadow-[0_6px_20px_rgba(122,18,245,0.4)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
                        >
                          Confirm Withdrawal
                        </button>
                      </form>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </main>
  );
}

