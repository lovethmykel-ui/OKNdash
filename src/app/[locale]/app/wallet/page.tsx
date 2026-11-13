'use client';

/**
 * /app/wallet — Sleek Web3 & Fintech Custody Wallet Dashboard.
 *
 * Integrated with the portfolio segmented control:
 *   Overview -> /app/portfolio
 *   Activity -> /app/portfolio?tab=activity
 *   Holdings (Active) -> /app/wallet
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/i18n/navigation';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Coins,
  Copy,
  Eye,
  EyeOff,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Users,
  Zap,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { useOknBalance } from '@/lib/hooks/use-wallet';
import { useClaimEligibility } from '@/lib/hooks/use-claim';
import { useMe } from '@/lib/hooks/use-me';
import { api } from '@/lib/api/client';
import { AnimatePresence, motion } from 'motion/react';
import { OknWatermark } from '@/components/ui/okn-watermark';
import { formatPoints, formatWei } from '@/lib/utils';
import { toast } from 'sonner';

export default function WalletPage() {
  const { address } = useAccount();
  const qc = useQueryClient();
  const me = useMe();
  const oknBalance = useOknBalance();
  const eligibility = useClaimEligibility();

  const [hideBalance, setHideBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [switchingWallet, setSwitchingWallet] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAsset, setWithdrawAsset] = useState<'BNB' | 'OKN'>('BNB');

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
  const oknDisplay =
    oknBalance.data != null ? `${formatWei(oknBalance.data)} $OKN` : '693,333 $OKN';

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(currentAddress);
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info('Address copied');
    }
  };

  const handleSwitchDemoWallet = async () => {
    setSwitchingWallet(true);
    try {
      const res = await api.cycleDemoWallet();
      await qc.invalidateQueries({ queryKey: ['me'] });
      toast.success(
        `Switched demo wallet to ${res.walletAddress.slice(0, 6)}...${res.walletAddress.slice(-4)}`,
      );
    } finally {
      setSwitchingWallet(false);
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAddress) {
      toast.error('Please enter a destination address');
      return;
    }
    toast.success(`Withdrawal request for ${withdrawAmount || '0.1'} ${withdrawAsset} submitted!`);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
    setWithdrawAddress('');
  };

  return (
    <main className="space-y-4 md:space-y-6 pb-12">
      {/* Mobile Segmented Switcher */}
      <div className="block md:hidden">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[var(--s1)] border border-[var(--line)] shadow-xs">
          <Link
            href="/app/portfolio"
            className="flex items-center justify-center py-2 px-2 rounded-xl text-xs font-extrabold text-[var(--mut)] hover:text-[var(--tx)] active:scale-95 transition-all cursor-pointer"
          >
            Overview
          </Link>
          <Link
            href="/app/portfolio?tab=activity"
            className="flex items-center justify-center py-2 px-2 rounded-xl text-xs font-extrabold text-[var(--mut)] hover:text-[var(--tx)] active:scale-95 transition-all cursor-pointer"
          >
            Activity
          </Link>
          <span className="flex items-center justify-center py-2 px-2 rounded-xl text-xs font-extrabold bg-[#7A12F5] text-white shadow-[0_2px_10px_rgba(122,18,245,0.35)] cursor-default">
            Holdings
          </span>
        </div>
      </div>

      {/* Desktop Header with integrated switcher */}
      <div className="hidden md:flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--tx)] md:text-3xl">
            Wallet &amp; Holdings
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--mut)]">
            Your $OKN custody vault, on-chain balances, and payout rails.
          </p>
        </div>
        <div className="inline-flex items-center rounded-xl border border-[var(--line)] bg-[var(--s1)] p-1 gap-1">
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

      {/* 1. Sleek Fintech Hero Card */}
      <section
        className="relative overflow-hidden rounded-[24px] md:rounded-[28px] border border-[var(--line)] p-5 sm:p-6 md:p-7 shadow-sm"
        style={{
          background:
            'linear-gradient(135deg, rgba(122, 18, 245, 0.22) 0%, rgba(9, 180, 255, 0.1) 100%), var(--s1)',
        }}
      >
        <OknWatermark variant="card" size="md" />
        {/* Top Row: Eyebrow + Eye Toggle on Left, Compact Address + Switch Button on Right */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[var(--mut)]">
              Total Net Asset Value
            </span>
            <button
              type="button"
              onClick={toggleBalance}
              className="flex size-7 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--s2)]/80 text-[var(--mut)] hover:text-[var(--tx)] transition-colors cursor-pointer"
              aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
            >
              {hideBalance ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>

          {/* Compact Single-Row Wallet Pill + Demo Switcher */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={copyAddress}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--s2)]/90 px-3 py-1.5 text-xs font-mono font-bold text-[var(--tx)] hover:border-[#7A12F5]/50 transition-colors cursor-pointer"
              title="Copy wallet address"
            >
              <span className="size-2 rounded-full bg-[#2FBD8E]" />
              <span>{displayAddress}</span>
              {copied ? (
                <Check className="size-3 text-[#2FBD8E]" />
              ) : (
                <Copy className="size-3 text-[var(--mut)]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => void handleSwitchDemoWallet()}
              disabled={switchingWallet}
              title="Switch Demo Wallet"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#7A12F5]/40 bg-[#7A12F5]/20 px-3 py-1.5 text-[11px] font-extrabold text-[#C9A6FF] hover:bg-[#7A12F5] hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`size-3 ${switchingWallet ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Switch Wallet</span>
              <span className="sm:hidden">Switch</span>
            </button>
          </div>
        </div>

        {/* Center Row: Primary Balance + 24h Change */}
        <div className="relative z-10 mt-3 sm:mt-4 flex flex-wrap items-baseline gap-2.5 sm:gap-3">
          <span className="num text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--tx)] tracking-tight tabular-nums">
            {hideBalance ? '••••••••' : '$1,428.50'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#2FBD8E]/30 bg-[#2FBD8E]/15 px-2.5 py-0.5 text-xs font-extrabold text-[#2FBD8E] tabular-nums">
            +$142.50 (+11.1%)
          </span>
        </div>

        {/* Bottom Row: 4-Column Single-Row Action Dock (Mobile & Desktop) */}
        <div className="relative z-10 mt-5 pt-4 border-t border-[var(--line)]/80 grid grid-cols-4 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowDepositModal(true)}
            className="group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-[var(--line)] bg-[var(--s2)]/90 py-2.5 sm:py-3 px-2 text-xs font-extrabold text-[var(--tx)] hover:border-[#09B4FF]/50 hover:bg-[var(--s1)] active:scale-95 transition-all cursor-pointer"
          >
            <span className="flex size-8 sm:size-7 items-center justify-center rounded-xl bg-[#09B4FF]/15 text-[#09B4FF] group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="size-4 stroke-[2.4]" />
            </span>
            <span className="text-[11px] sm:text-xs whitespace-nowrap">Deposit</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            className="group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-[var(--line)] bg-[var(--s2)]/90 py-2.5 sm:py-3 px-2 text-xs font-extrabold text-[var(--tx)] hover:border-[#FFD60A]/50 hover:bg-[var(--s1)] active:scale-95 transition-all cursor-pointer"
          >
            <span className="flex size-8 sm:size-7 items-center justify-center rounded-xl bg-[#FFD60A]/15 text-[#FFD60A] group-hover:scale-105 transition-transform">
              <ArrowUpRight className="size-4 stroke-[2.4]" />
            </span>
            <span className="text-[11px] sm:text-xs whitespace-nowrap">Withdraw</span>
          </button>

          <Link
            href="/app/buy"
            className="group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-[#7A12F5]/40 bg-[#7A12F5]/15 py-2.5 sm:py-3 px-2 text-xs font-extrabold text-[var(--tx)] hover:bg-[#7A12F5] hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            <span className="flex size-8 sm:size-7 items-center justify-center rounded-xl bg-[#7A12F5] text-white group-hover:bg-white/20 transition-colors">
              <ShoppingCart className="size-4 stroke-[2.2]" />
            </span>
            <span className="text-[11px] sm:text-xs whitespace-nowrap">Buy $OKN</span>
          </Link>

          <Link
            href="/app/tasks"
            className="group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-[var(--line)] bg-[var(--s2)]/90 py-2.5 sm:py-3 px-2 text-xs font-extrabold text-[var(--tx)] hover:border-[#2FBD8E]/50 hover:bg-[var(--s1)] active:scale-95 transition-all cursor-pointer"
          >
            <span className="flex size-8 sm:size-7 items-center justify-center rounded-xl bg-[#2FBD8E]/15 text-[#2FBD8E] group-hover:scale-105 transition-transform">
              <Zap className="size-4 stroke-[2.2]" />
            </span>
            <span className="text-[11px] sm:text-xs whitespace-nowrap">Earn</span>
          </Link>
        </div>
      </section>

      {/* 2. 4-Column Account Summary KPI Strip — Clean Vertical Stack on Mobile so Labels Never Clip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Liquid BNB */}
        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--mut)] truncate">Liquid On-Chain</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#F3BA2F]/15 text-[#F3BA2F]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bnb-logo.png" alt="BNB" className="size-4.5 object-contain" />
            </span>
          </div>
          <div>
            <p className="num text-lg sm:text-xl font-extrabold text-[var(--tx)] tabular-nums">
              {hideBalance ? '••••••' : '$870.00'}
            </p>
            <p className="mt-0.5 text-[11px] sm:text-xs font-semibold text-[var(--mut)] truncate">
              1.45 BNB · Gas Ready
            </p>
          </div>
        </div>

        {/* KPI 2: Presale $OKN */}
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
            <p className="mt-0.5 text-[11px] sm:text-xs font-semibold text-[#C9A6FF] truncate">
              693,333 $OKN Allocated
            </p>
          </div>
        </div>

        {/* KPI 3: Partner Vault */}
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
            <p className="mt-0.5 text-[11px] sm:text-xs font-semibold text-[var(--mut)] truncate">
              0.238 BNB · 14 Invites
            </p>
          </div>
        </div>

        {/* KPI 4: OK Points */}
        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--mut)] truncate">OK Points</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#09B4FF]/15 text-[#09B4FF]">
              <Coins className="size-4" />
            </span>
          </div>
          <div>
            <p className="num text-lg sm:text-xl font-extrabold text-[var(--tx)] tabular-nums">
              {formatPoints(points)} pts
            </p>
            <p className="mt-0.5 text-[11px] sm:text-xs font-semibold text-[#FFD60A] truncate">
              Merkle Claim Ready
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Split: Asset Holdings Breakdown & Custody Rails */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
        {/* Left Column (lg:col-span-7): Asset Holdings + Integrated Allocation Bar */}
        <div className="lg:col-span-7 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-5">
          {/* Header + Integrated Allocation Progress */}
          <div className="space-y-3 pb-4 border-b border-[var(--line)]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
                Asset Holdings
              </h2>
              <span className="text-xs font-semibold text-[var(--mut)]">
                4 Active Positions · 100% Backed
              </span>
            </div>

            {/* Multi-Segment Allocation Bar */}
            <div className="h-2.5 w-full rounded-full bg-[var(--s2)] overflow-hidden flex gap-1 p-0.5">
              <div className="h-full rounded-full bg-[#F3BA2F]" style={{ width: '60.9%' }} />
              <div className="h-full rounded-full bg-[#7A12F5]" style={{ width: '29.1%' }} />
              <div className="h-full rounded-full bg-[#2FBD8E]" style={{ width: '10.0%' }} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] sm:text-xs font-semibold text-[var(--mut)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#F3BA2F]" />
                <span>BNB 60.9%</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#7A12F5]" />
                <span>$OKN 29.1%</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#2FBD8E]" />
                <span>Partner Vault 10.0%</span>
              </span>
            </div>
          </div>

          {/* Clean Asset Rows */}
          <div className="divide-y divide-[var(--line)]">
            {/* Row 1: BNB */}
            <div className="flex items-center justify-between gap-3 py-3.5 first:pt-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3BA2F]/15 border border-[#F3BA2F]/25">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/bnb-logo.png" alt="BNB" className="size-5.5 object-contain" />
                </span>
                <div className="min-w-0">
                  <div className="font-extrabold text-sm text-[var(--tx)] truncate">
                    BNB Smart Chain
                  </div>
                  <div className="text-xs font-medium text-[var(--mut)] truncate">
                    Native Gas &amp; Settlement · BEP-20
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="num font-extrabold text-sm text-[var(--tx)] tabular-nums">
                  1.45 BNB
                </div>
                <div className="text-xs font-semibold text-[var(--mut)] tabular-nums">
                  {hideBalance ? '••••••' : '$870.00'}
                </div>
              </div>
            </div>

            {/* Row 2: $OKN Token */}
            <div className="flex items-center justify-between gap-3 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-2xl bg-[#7A12F5]/15 border border-[#7A12F5]/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/okn-logo.png" alt="$OKN" className="size-6 object-contain" />
                </span>
                <div className="min-w-0">
                  <div className="font-extrabold text-sm text-[var(--tx)] truncate">
                    $OKN Token
                  </div>
                  <div className="text-xs font-medium text-[#C9A6FF] truncate">
                    Stage 2 Presale Allocation
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="num font-extrabold text-sm text-[var(--tx)] tabular-nums">
                  {oknDisplay}
                </div>
                <div className="text-xs font-semibold text-[var(--mut)] tabular-nums">
                  {hideBalance ? '••••••' : '$416.00'}
                </div>
              </div>
            </div>

            {/* Row 3: Partner Commission Vault */}
            <div className="flex items-center justify-between gap-3 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-2xl bg-[#2FBD8E]/15 border border-[#2FBD8E]/25 text-[#2FBD8E]">
                  <Users className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="font-extrabold text-sm text-[var(--tx)] truncate">
                    Partner Commission Vault
                  </div>
                  <div className="text-xs font-medium text-[#2FBD8E] truncate">
                    14 Active Referrals · Instant Payout
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="num font-extrabold text-sm text-[#2FBD8E] tabular-nums">
                  0.238 BNB
                </div>
                <div className="text-xs font-semibold text-[var(--mut)] tabular-nums">
                  {hideBalance ? '••••••' : '$142.50'}
                </div>
              </div>
            </div>

            {/* Row 4: OK Points */}
            <div className="flex items-center justify-between gap-3 py-3.5 last:pb-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-2xl bg-[#09B4FF]/15 border border-[#09B4FF]/25 text-[#09B4FF]">
                  <Coins className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="font-extrabold text-sm text-[var(--tx)] truncate">
                    OK Points Balance
                  </div>
                  <div className="text-xs font-medium text-[#FFD60A] truncate">
                    Eligible for Merkle Claim
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="num font-extrabold text-sm text-[#09B4FF] tabular-nums">
                  {formatPoints(points)} pts
                </div>
                <div className="text-xs font-semibold text-[var(--mut)]">
                  1:1 $OKN Claim
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-5): Custody Details & Payment Rails */}
        <div className="lg:col-span-5 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-5">
          <div className="pb-4 border-b border-[var(--line)]">
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
              Custody &amp; Payment Rails
            </h2>
            <p className="mt-0.5 text-xs text-[var(--mut)]">
              Connected settlement gateways for your bound wallet.
            </p>
          </div>

          <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--s2)]/60 px-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="font-semibold text-[var(--mut)]">Bound Address</span>
              <button
                type="button"
                onClick={copyAddress}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[var(--tx)] hover:text-[#C9A6FF] transition-colors cursor-pointer"
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
              <span className="font-bold text-[var(--tx)]">BNB Smart Chain (BEP-20)</span>
            </div>

            <div className="flex items-center justify-between gap-3 py-3">
              <span className="font-semibold text-[var(--mut)]">Crypto Gateway</span>
              <span className="font-bold text-[#09B4FF]">300+ Coins Enabled</span>
            </div>

            <div className="flex items-center justify-between gap-3 py-3">
              <span className="font-semibold text-[var(--mut)]">Card On-Ramp</span>
              <span className="font-bold text-[#2FBD8E]">Visa · Mastercard · Apple Pay</span>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 flex items-start gap-3">
            <ShieldCheck className="size-5 text-[#2FBD8E] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-[var(--mut)]">
              <span className="font-extrabold block text-[var(--tx)] mb-0.5">
                Non-Custodial Merkle Verification
              </span>
              Your presale allocations and OK Points claims are cryptographically verified on BNB Smart Chain.
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal — Centered on Web & Mobile */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showDepositModal && (
              <motion.div
                key="wallet-deposit-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
                onClick={() => setShowDepositModal(false)}
              >
                <motion.div
                  key="wallet-deposit-dialog"
                  initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.94, y: 10, filter: 'blur(8px)' }}
                  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-[380px] sm:max-w-[420px] rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.65)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">
                      Deposit to Account
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowDepositModal(false)}
                      className="size-8 rounded-full bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)] flex items-center justify-center cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[var(--s2)] border border-[var(--line)] my-3.5">
                    <div className="size-36 bg-white p-2 rounded-xl flex items-center justify-center shadow-md">
                      <QrCode className="size-32 text-black" />
                    </div>
                    <p className="text-xs font-semibold text-[var(--mut)] mt-2.5">
                      Scan QR or copy address below
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--mut)] uppercase tracking-wider">
                      Deposit Address (BNB / BEP-20)
                    </label>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--line)] bg-[var(--s2)]">
                      <span className="font-mono text-xs font-bold text-[var(--tx)] flex-1 truncate">
                        {currentAddress}
                      </span>
                      <button
                        type="button"
                        onClick={copyAddress}
                        className="px-3 py-1.5 rounded-lg bg-[#7A12F5] text-white text-xs font-bold shadow-sm hover:bg-[#8C38F7] cursor-pointer"
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--mut)] mt-4 text-center">
                    Only send BNB or BEP-20 tokens to this address on BNB Smart Chain.
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Withdraw Modal — Centered on Web & Mobile */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showWithdrawModal && (
              <motion.div
                key="wallet-withdraw-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
                onClick={() => setShowWithdrawModal(false)}
              >
                <motion.div
                  key="wallet-withdraw-dialog"
                  initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.94, y: 10, filter: 'blur(8px)' }}
                  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-[380px] sm:max-w-[420px] rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.65)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">
                      Withdraw Funds
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowWithdrawModal(false)}
                      className="size-8 rounded-full bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)] flex items-center justify-center cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-[var(--mut)] uppercase tracking-wider">
                        Select Asset
                      </label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setWithdrawAsset('BNB')}
                          className={`py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                            withdrawAsset === 'BNB'
                              ? 'border-[#F3BA2F] bg-[#F3BA2F]/15 text-[#F3BA2F]'
                              : 'border-[var(--line)] bg-[var(--s2)] text-[var(--mut)]'
                          }`}
                        >
                          BNB (1.45 Available)
                        </button>
                        <button
                          type="button"
                          onClick={() => setWithdrawAsset('OKN')}
                          className={`py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                            withdrawAsset === 'OKN'
                              ? 'border-[#7A12F5] bg-[#7A12F5]/15 text-[#C9A6FF]'
                              : 'border-[var(--line)] bg-[var(--s2)] text-[var(--mut)]'
                          }`}
                        >
                          $OKN (693K Available)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--mut)] uppercase tracking-wider">
                        Recipient Address
                      </label>
                      <input
                        type="text"
                        placeholder="0x..."
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                        className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-xs font-mono font-bold text-[var(--tx)] outline-none focus:border-[#7A12F5]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--mut)] uppercase tracking-wider">
                        Amount
                      </label>
                      <div className="relative mt-1">
                        <input
                          type="number"
                          step="any"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-sm font-bold text-[var(--tx)] outline-none focus:border-[#7A12F5]"
                        />
                        <button
                          type="button"
                          onClick={() => setWithdrawAmount(withdrawAsset === 'BNB' ? '1.45' : '693333')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-[var(--line)] text-[10px] font-extrabold text-[var(--tx)]"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-11 rounded-xl bg-[#7A12F5] text-white text-xs font-extrabold shadow-md hover:bg-[#8C38F7] transition-all cursor-pointer mt-2"
                    >
                      Confirm Withdrawal
                    </button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </main>
  );
}

