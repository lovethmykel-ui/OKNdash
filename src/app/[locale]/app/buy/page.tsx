'use client';

/**
 * /app/buy — Fixed-Rate $OKN Presale Gateway.
 *
 * Designed for mobile-first touch ergonomics (375px–430px) and full desktop
 * 2-column balance (1440px):
 *   1. Crypto Deposit: Multi-chain direct deposit (USDT BEP-20/TRC-20, BTC, ETH, SOL, BNB)
 *   2. Web3 Wallet: Instant 1-click BNB Smart Chain swap with connected Demo Wallet
 */
import { useState } from 'react';
import {
  ArrowDown,
  Check,
  CheckCircle2,
  ChevronDown,
  Coins,
  Copy,
  HelpCircle,
  Lock,
  QrCode,
  ShieldCheck,
  Wallet,
  Zap,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseEther } from 'viem';
import { api, getDemoWalletAddress } from '@/lib/api/client';
import { formatPoints } from '@/lib/utils';
import { triggerConfetti } from '@/lib/confetti';
import { toast } from 'sonner';

type GatewayTab = 'deposit' | 'connect-wallet';

interface CryptoOption {
  id: string;
  symbol: string;
  ticker: string;
  name: string;
  network: string;
  accentColor: string;
}

const CRYPTO_OPTIONS: CryptoOption[] = [
  { id: 'usdt-bsc', symbol: 'USDT', ticker: 'USDT', name: 'Tether', network: 'BEP-20', accentColor: '#26A17B' },
  { id: 'usdt-trx', symbol: 'USDT-TRC20', ticker: 'USDT', name: 'Tether', network: 'TRC-20', accentColor: '#26A17B' },
  { id: 'btc', symbol: 'BTC', ticker: 'BTC', name: 'Bitcoin', network: 'Bitcoin', accentColor: '#F7931A' },
  { id: 'eth', symbol: 'ETH', ticker: 'ETH', name: 'Ethereum', network: 'ERC-20', accentColor: '#627EEA' },
  { id: 'sol', symbol: 'SOL', ticker: 'SOL', name: 'Solana', network: 'Solana', accentColor: '#9945FF' },
  { id: 'bnb', symbol: 'BNB', ticker: 'BNB', name: 'BNB', network: 'BEP-20', accentColor: '#F3BA2F' },
];

const DEPOSIT_STEPS = [
  {
    step: '01',
    title: 'Select network & amount',
    body: 'Pick USDT, BTC, ETH, SOL, or BNB and enter your USD amount ($30 minimum).',
  },
  {
    step: '02',
    title: 'Open deposit invoice',
    body: 'Generate a dedicated single-use deposit address and QR code for your selected chain.',
  },
  {
    step: '03',
    title: 'Send from wallet or exchange',
    body: 'Transfer directly from Binance, Coinbase, Bybit, or any self-custody wallet.',
  },
  {
    step: '04',
    title: 'Instant Merkle allocation',
    body: 'Once confirmed on-chain (1–3 mins), your $OKN balance updates in your portfolio.',
  },
];

const WALLET_STEPS = [
  {
    step: '01',
    title: 'Verify connected wallet',
    body: 'Pair your BNB Smart Chain wallet (or use the pre-connected Demo Wallet in preview).',
  },
  {
    step: '02',
    title: 'Enter BNB contribution',
    body: 'Choose an amount from 0.05 BNB. Contributions of 1.0 BNB+ unlock a +5% token bonus.',
  },
  {
    step: '03',
    title: 'Approve swap transaction',
    body: 'Tap Buy $OKN to broadcast your contribution with standard BSC gas (~$0.05).',
  },
  {
    step: '04',
    title: 'Immediate token credit',
    body: 'The presale contract credits your $OKN allocation in under 3 seconds.',
  },
];

const FAQS = [
  {
    q: 'Should I use Crypto Deposit or Web3 Wallet?',
    a: 'Use Web3 Wallet if you hold BNB on BNB Smart Chain for an instant 1-click swap. Choose Crypto Deposit if you prefer paying with USDT, BTC, ETH, SOL, or sending directly from an exchange like Binance or Coinbase.',
  },
  {
    q: 'Can I transfer directly from a centralized exchange?',
    a: 'Yes. The Crypto Deposit invoice generates a dedicated receiving address that accepts direct withdrawals from Binance, Bybit, Coinbase, OKX, or Kraken. Just match the selected network.',
  },
  {
    q: 'How does the +5% Tier Bonus work?',
    a: 'Any single contribution of 1.0 BNB or more (or $600+ USD via Crypto Deposit) automatically adds +5% bonus $OKN tokens to your allocation at checkout.',
  },
  {
    q: 'When can I claim my purchased $OKN tokens?',
    a: 'Purchased $OKN tokens are recorded immediately in your portfolio and anchored to the on-chain Merkle ledger with zero vesting lockup at launch.',
  },
];

export default function BuyPage() {
  const { address } = useAccount();
  const qc = useQueryClient();
  const activeAddress = address ?? getDemoWalletAddress();
  const shortAddr = `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`;

  const [activeTab, setActiveTab] = useState<GatewayTab>('deposit');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Web3 BNB State
  const [bnbAmount, setBnbAmount] = useState('1.0');
  const [isSubmittingWeb3, setIsSubmittingWeb3] = useState(false);

  // Crypto Deposit State
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption>(CRYPTO_OPTIONS[0]);
  const [usdAmount, setUsdAmount] = useState('250');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceCopied, setInvoiceCopied] = useState(false);

  const RATE_PER_BNB = 1_000_000; // 1 BNB = 1,000,000 $OKN ($0.00060)
  const BNB_USD_ESTIMATE = 600;
  const LISTING_PRICE_USD = 0.0025;

  const numBnb = parseFloat(bnbAmount) || 0;
  const oknFromBnb = Math.round(numBnb * RATE_PER_BNB);
  const bnbBonus = numBnb >= 1 ? Math.round(oknFromBnb * 0.05) : 0;
  const totalOknFromBnb = oknFromBnb + bnbBonus;
  const bnbListingValue = Math.round(totalOknFromBnb * LISTING_PRICE_USD);

  const numUsd = parseFloat(usdAmount) || 0;
  const baseOknFromUsd = Math.round((numUsd / BNB_USD_ESTIMATE) * RATE_PER_BNB);
  const usdBonus = numUsd >= 600 ? Math.round(baseOknFromUsd * 0.05) : 0;
  const oknFromUsd = baseOknFromUsd + usdBonus;
  const usdListingValue = Math.round(oknFromUsd * LISTING_PRICE_USD);

  const handleWeb3Buy = () => {
    if (numBnb <= 0) {
      toast.error('Please enter a valid BNB amount');
      return;
    }

    setIsSubmittingWeb3(true);
    setTimeout(async () => {
      const bnbWei = parseEther(String(numBnb));
      const oknWei = BigInt(totalOknFromBnb) * 10n ** 18n;
      await api.recordDemoPurchase(bnbWei, oknWei);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['demo-okn-balance'] }),
        qc.invalidateQueries({ queryKey: ['demo-purchased-bnb'] }),
        qc.invalidateQueries({ queryKey: ['purchase-history'] }),
        qc.invalidateQueries({ queryKey: ['portfolio'] }),
        qc.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      setIsSubmittingWeb3(false);
      triggerConfetti();
      toast.success(
        `Demo purchase confirmed! ${formatPoints(totalOknFromBnb)} $OKN allocated to ${shortAddr}.`,
      );
    }, 800);
  };

  const handleGenerateInvoice = () => {
    if (numUsd <= 0) {
      toast.error('Please enter a valid purchase amount');
      return;
    }
    setShowInvoiceModal(true);
  };

  const handleSimulateInvoicePaid = async () => {
    const bnbEquivalent = Math.max(0.01, numUsd / BNB_USD_ESTIMATE);
    const bnbWei = parseEther(bnbEquivalent.toFixed(4));
    const oknWei = BigInt(oknFromUsd) * 10n ** 18n;
    await api.recordDemoPurchase(bnbWei, oknWei);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['demo-okn-balance'] }),
      qc.invalidateQueries({ queryKey: ['demo-purchased-bnb'] }),
      qc.invalidateQueries({ queryKey: ['purchase-history'] }),
      qc.invalidateQueries({ queryKey: ['portfolio'] }),
      qc.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
    setShowInvoiceModal(false);
    triggerConfetti();
    toast.success(`Demo deposit confirmed! ${formatPoints(oknFromUsd)} $OKN credited to your portfolio.`);
  };

  const copyInvoiceAddress = async () => {
    try {
      await navigator.clipboard.writeText('0x892aF21b76A93F424e75A0Bf9689874D14c9B231');
      setInvoiceCopied(true);
      toast.success('Deposit address copied!');
      setTimeout(() => setInvoiceCopied(false), 2000);
    } catch {
      toast.info('Address copied');
    }
  };

  const steps = activeTab === 'deposit' ? DEPOSIT_STEPS : WALLET_STEPS;

  return (
    <main className="space-y-5 md:space-y-7 pb-10">
      {/* 1. Compact, High-Contrast Stage 2 Presale Banner */}
      <section className="rounded-2xl md:rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[#C9A6FF]">
              <span>Presale Stage 2</span>
              <span aria-hidden="true" className="text-[var(--mut)]">·</span>
              <span className="text-[var(--mut)]">BNB Smart Chain</span>
              <span aria-hidden="true" className="text-[var(--mut)]">·</span>
              <span className="text-[#2FBD8E]">Zero Vesting</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--tx)]">
              Buy $OKN Token
            </h1>
            <p className="text-xs sm:text-sm text-[var(--mut)] max-w-xl">
              Fixed presale rate of <span className="font-mono font-bold text-[var(--tx)]">1,000,000 $OKN</span> per 1 BNB before exchange listing.
            </p>
          </div>

          {/* Stage Progress Meter */}
          <div className="w-full lg:w-[340px] rounded-xl bg-[var(--s2)] border border-[var(--line)] p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[var(--mut)] whitespace-nowrap">Stage 2 Raised</span>
              <span className="font-mono font-bold text-[var(--tx)] tabular-nums whitespace-nowrap">
                $412,800 <span className="text-[var(--mut)] font-normal">/ $600K</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-black/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7A12F5] via-[#9D4EDD] to-[#00C2FF]"
                style={{ width: '68.4%' }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--mut)] tabular-nums whitespace-nowrap">
              <span>68.4% Sold</span>
              <span>Next Stage: $0.00085</span>
            </div>
          </div>
        </div>

        {/* 3-Column Key Rate Strip — Single-screen scannable on mobile */}
        <div className="mt-4 pt-3.5 border-t border-[var(--line)] grid grid-cols-3 gap-2 sm:gap-4">
          <div>
            <div className="text-[11px] font-medium text-[var(--mut)] whitespace-nowrap">Presale Price</div>
            <div className="font-mono text-xs sm:text-base font-extrabold text-[var(--tx)] tabular-nums mt-0.5 whitespace-nowrap">
              $0.00060
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-[var(--mut)] whitespace-nowrap">Listing Target</div>
            <div className="font-mono text-xs sm:text-base font-extrabold text-[#2FBD8E] tabular-nums mt-0.5 whitespace-nowrap">
              $0.0025 <span className="text-[10px] sm:text-[11px] font-semibold">(4.1×)</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-[var(--mut)] whitespace-nowrap">Tier Bonus</div>
            <div className="font-mono text-xs sm:text-base font-extrabold text-[#FFD60A] tabular-nums mt-0.5 whitespace-nowrap">
              +5% <span className="text-[10px] sm:text-[11px] font-normal text-[var(--mut)]">(&ge;1 BNB)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Split Grid: Exchange Widget (Left) + Specs & Guide (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
        {/* Left Column (7 cols): Unified Purchase Widget */}
        <div className="lg:col-span-7 rounded-2xl md:rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-6 shadow-sm space-y-5">
          {/* Segmented Payment Mode Switcher — 44px+ touch targets, strictly single-line */}
          <div
            role="tablist"
            aria-label="Payment method"
            className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border border-[var(--line)] bg-[var(--s2)]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'deposit'}
              onClick={() => setActiveTab('deposit')}
              className={`min-h-[44px] px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === 'deposit'
                  ? 'bg-[#7A12F5] text-white shadow-sm'
                  : 'text-[var(--mut)] hover:text-[var(--tx)]'
              }`}
            >
              <Coins className="size-4 shrink-0" />
              <span>Deposit</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'connect-wallet'}
              onClick={() => setActiveTab('connect-wallet')}
              className={`min-h-[44px] px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === 'connect-wallet'
                  ? 'bg-[#7A12F5] text-white shadow-sm'
                  : 'text-[var(--mut)] hover:text-[var(--tx)]'
              }`}
            >
              <Wallet className="size-4 shrink-0" />
              <span>Connect Wallet</span>
            </button>
          </div>

          {activeTab === 'deposit' ? (
            /* =================== CRYPTO DEPOSIT PANEL =================== */
            <div className="space-y-4">
              {/* Step A: Asset & Network Grid (3 cols on mobile, zero truncation) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--mut)]">1. Select Currency &amp; Network</span>
                  <span className="text-[11px] text-[var(--mut)]">300+ supported</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {CRYPTO_OPTIONS.map((coin) => {
                    const isSelected = selectedCrypto.id === coin.id;
                    return (
                      <button
                        key={coin.id}
                        type="button"
                        onClick={() => setSelectedCrypto(coin)}
                        className={`min-h-[54px] px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'border-[#7A12F5] bg-[#7A12F5]/12 text-[var(--tx)] shadow-xs'
                            : 'border-[var(--line)] bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)]'
                        }`}
                      >
                        <span
                          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-black tracking-tighter text-white"
                          style={{ backgroundColor: coin.accentColor }}
                        >
                          {coin.ticker}
                        </span>
                        <div className="min-w-0 leading-tight">
                          <div className="font-bold text-xs text-[var(--tx)] whitespace-nowrap">
                            {coin.ticker}
                          </div>
                          <div className="text-[10px] font-medium text-[var(--mut)] whitespace-nowrap">
                            {coin.network}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step B: "You Pay" Box */}
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--mut)] whitespace-nowrap">
                    2. You Pay (USD)
                  </span>
                  <span className="font-mono text-[11px] text-[var(--mut)] whitespace-nowrap">
                    Min $30 · +5% at $600+
                  </span>
                </div>

                <div className="relative flex items-center">
                  <span className="font-mono text-2xl font-extrabold text-[var(--mut)] mr-1.5">$</span>
                  <input
                    type="number"
                    step="10"
                    min="30"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    placeholder="250"
                    aria-label="Contribution Amount (USD)"
                    className="w-full bg-transparent font-mono text-2xl sm:text-3xl font-extrabold text-[var(--tx)] tabular-nums outline-none"
                  />
                  <span className="shrink-0 rounded-lg border border-[var(--line)] bg-[var(--s1)] px-2.5 py-1 text-xs font-bold text-[var(--tx)] whitespace-nowrap">
                    {selectedCrypto.ticker} · {selectedCrypto.network}
                  </span>
                </div>

                {/* Ergonomic Quick Amount Buttons */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[
                    { label: '$50', val: '50' },
                    { label: '$100', val: '100' },
                    { label: '$250', val: '250' },
                    { label: '$500', val: '500' },
                    { label: '$1K', val: '1000' },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setUsdAmount(preset.val)}
                      className={`min-h-[38px] rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        usdAmount === preset.val
                          ? 'border-[#7A12F5] bg-[#7A12F5]/20 text-[var(--tx)]'
                          : 'border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] hover:text-[var(--tx)]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider Arrow */}
              <div className="flex justify-center -my-2 relative z-10">
                <span className="flex size-8 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] shadow-xs">
                  <ArrowDown className="size-4" />
                </span>
              </div>

              {/* Step C: "You Receive" Box — Clean Single-Line Numeric Alignment */}
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 sm:p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--mut)]">You Receive (Estimated)</span>
                  <span className="font-mono text-[11px] font-semibold text-[#2FBD8E] tabular-nums">
                    1 $OKN = $0.00060
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#FFD60A] tabular-nums whitespace-nowrap">
                    {formatPoints(oknFromUsd)}
                  </span>
                  <span className="text-sm font-extrabold text-[var(--tx)] whitespace-nowrap">
                    $OKN
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--mut)] pt-1 border-t border-[var(--line)] tabular-nums">
                  <span>
                    {usdBonus > 0
                      ? `Includes +${formatPoints(usdBonus)} $OKN (+5% bonus)`
                      : 'Add $600+ to unlock +5% bonus'}
                  </span>
                  <span className="font-mono text-[#2FBD8E] font-semibold whitespace-nowrap">
                    ~${formatPoints(usdListingValue)} at listing
                  </span>
                </div>
              </div>

              {/* Primary CTA Button — 48px touch target, single-line */}
              <button
                type="button"
                onClick={handleGenerateInvoice}
                className="w-full h-12 rounded-xl bg-[#7A12F5] hover:bg-[#8C38F7] text-white text-sm font-bold shadow-md shadow-[#7A12F5]/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap px-4"
              >
                <QrCode className="size-4 shrink-0" />
                <span>Generate Deposit Invoice</span>
              </button>
            </div>
          ) : (
            /* =================== WEB3 WALLET BNB PANEL =================== */
            <div className="space-y-4">
              {/* Connected Wallet Status Bar */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3.5 py-2.5 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Wallet className="size-4 text-[#F3BA2F] shrink-0" />
                  <span className="font-semibold text-[var(--mut)] truncate">Connected Wallet</span>
                </div>
                <span className="font-mono font-bold text-[var(--tx)] whitespace-nowrap">
                  {shortAddr} · BSC
                </span>
              </div>

              {/* "You Pay (BNB)" Box */}
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--mut)] whitespace-nowrap">
                    Enter BNB Amount
                  </span>
                  <span className="font-mono text-[11px] text-[var(--mut)] tabular-nums whitespace-nowrap">
                    Est. ${formatPoints(Math.round(numBnb * BNB_USD_ESTIMATE))} USD
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    min="0.05"
                    max="10"
                    value={bnbAmount}
                    onChange={(e) => setBnbAmount(e.target.value)}
                    placeholder="1.0"
                    aria-label="Enter BNB Amount"
                    className="w-full bg-transparent font-mono text-2xl sm:text-3xl font-extrabold text-[var(--tx)] tabular-nums outline-none"
                  />
                  <span className="shrink-0 rounded-lg border border-[#F3BA2F]/30 bg-[#F3BA2F]/15 px-3 py-1 text-xs font-extrabold text-[#F3BA2F] whitespace-nowrap">
                    BNB
                  </span>
                </div>

                {/* Quick Select Presets — 40px+ touch targets */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {['0.1', '0.5', '1.0', '5.0'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBnbAmount(val)}
                      className={`min-h-[40px] rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        bnbAmount === val
                          ? 'border-[#7A12F5] bg-[#7A12F5]/20 text-[var(--tx)]'
                          : 'border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] hover:text-[var(--tx)]'
                      }`}
                    >
                      {val} BNB
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider Arrow */}
              <div className="flex justify-center -my-2 relative z-10">
                <span className="flex size-8 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] shadow-xs">
                  <ArrowDown className="size-4" />
                </span>
              </div>

              {/* "You Receive ($OKN)" Box — Strictly Single-Line Rows */}
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--mut)]">Total You Receive</span>
                  <span className="font-mono text-[11px] font-semibold text-[#2FBD8E] tabular-nums">
                    ~${formatPoints(bnbListingValue)} at listing
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#FFD60A] tabular-nums whitespace-nowrap">
                    {formatPoints(totalOknFromBnb)}
                  </span>
                  <span className="text-sm font-extrabold text-[var(--tx)] whitespace-nowrap">
                    $OKN
                  </span>
                </div>

                <div className="pt-2 border-t border-[var(--line)] space-y-1 text-xs tabular-nums">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--mut)]">Base Allocation</span>
                    <span className="font-mono font-semibold text-[var(--tx)] whitespace-nowrap">
                      {formatPoints(oknFromBnb)} $OKN
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--mut)]">Tier Bonus (+5% on &ge;1 BNB)</span>
                    <span className="font-mono font-semibold text-[#2FBD8E] whitespace-nowrap">
                      {bnbBonus > 0 ? `+${formatPoints(bnbBonus)} $OKN` : '0 $OKN'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary CTA Button — Clean Single-Line Label */}
              <button
                type="button"
                onClick={handleWeb3Buy}
                disabled={isSubmittingWeb3}
                className="w-full h-12 rounded-xl bg-[#7A12F5] hover:bg-[#8C38F7] text-white text-sm font-bold shadow-md shadow-[#7A12F5]/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap px-4 disabled:opacity-60"
              >
                <Zap className="size-4 shrink-0" />
                <span>
                  {isSubmittingWeb3
                    ? 'Broadcasting Demo Swap...'
                    : `Buy Now (${bnbAmount || '1.0'} BNB)`}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Compact Presale Parameters & Step-by-Step Guide */}
        <div className="lg:col-span-5 space-y-5">
          {/* Presale Parameters — Compact 2-Column Metric Grid on Mobile */}
          <div className="rounded-2xl md:rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[var(--tx)]">Presale Parameters</h2>
              <span className="text-xs font-medium text-[var(--mut)]">Stage 2 Terms</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-[var(--s2)] border border-[var(--line)] p-3">
                <div className="text-[11px] font-medium text-[var(--mut)]">Exchange Rate</div>
                <div className="font-mono text-xs sm:text-sm font-bold text-[var(--tx)] tabular-nums mt-0.5 whitespace-nowrap">
                  1 BNB = 1M $OKN
                </div>
              </div>
              <div className="rounded-xl bg-[var(--s2)] border border-[var(--line)] p-3">
                <div className="text-[11px] font-medium text-[var(--mut)]">Min / Max Cap</div>
                <div className="font-mono text-xs sm:text-sm font-bold text-[var(--tx)] tabular-nums mt-0.5 whitespace-nowrap">
                  0.05 – 10 BNB
                </div>
              </div>
              <div className="rounded-xl bg-[var(--s2)] border border-[var(--line)] p-3">
                <div className="text-[11px] font-medium text-[var(--mut)]">Token Standard</div>
                <div className="font-mono text-xs sm:text-sm font-bold text-[var(--tx)] mt-0.5 whitespace-nowrap">
                  BEP-20 (BSC)
                </div>
              </div>
              <div className="rounded-xl bg-[var(--s2)] border border-[var(--line)] p-3">
                <div className="text-[11px] font-medium text-[var(--mut)]">Vesting Schedule</div>
                <div className="text-xs sm:text-sm font-bold text-[#2FBD8E] mt-0.5 whitespace-nowrap">
                  100% Unlocked
                </div>
              </div>
            </div>

            {/* Integrated Security Note */}
            <div className="flex items-start gap-3 pt-2 border-t border-[var(--line)] text-xs text-[var(--mut)] leading-relaxed">
              <ShieldCheck className="size-4 text-[#2FBD8E] shrink-0 mt-0.5" />
              <p>
                <strong className="font-semibold text-[var(--tx)]">Merkle-Verified Settlement:</strong>{' '}
                All contributions settle under 3 minutes with zero price slippage and cryptographic proof on BNB Smart Chain.
              </p>
            </div>
          </div>

          {/* Synced How-To Steps Card (Follows activeTab, single-line pills) */}
          <div className="rounded-2xl md:rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-[var(--tx)]">
                How to Buy
              </h2>
              <div className="inline-flex items-center rounded-lg border border-[var(--line)] bg-[var(--s2)] p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('deposit')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'deposit'
                      ? 'bg-[#7A12F5] text-white'
                      : 'text-[var(--mut)] hover:text-[var(--tx)]'
                  }`}
                >
                  Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('connect-wallet')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'connect-wallet'
                      ? 'bg-[#7A12F5] text-white'
                      : 'text-[var(--mut)] hover:text-[var(--tx)]'
                  }`}
                >
                  Wallet
                </button>
              </div>
            </div>

            <ol className="divide-y divide-[var(--line)]">
              {steps.map((item) => (
                <li key={item.step} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                  <span className="font-mono text-xs font-extrabold text-[#C9A6FF] bg-[#7A12F5]/15 rounded-lg size-7 shrink-0 flex items-center justify-center mt-0.5">
                    {item.step}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--tx)]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[var(--mut)] leading-relaxed mt-0.5">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* 3. Clean FAQ Section */}
      <section className="rounded-2xl md:rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-4 text-[#C9A6FF]" />
          <h2 className="text-base font-extrabold text-[var(--tx)]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="divide-y divide-[var(--line)]">
          {FAQS.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div key={faq.q} className="py-1">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full min-h-[46px] py-2.5 flex items-center justify-between gap-3 text-left text-xs sm:text-sm font-bold text-[var(--tx)] hover:text-[#C9A6FF] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`size-4 text-[var(--mut)] transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#C9A6FF]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="pb-3 text-xs text-[var(--mut)] leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Live Crypto Deposit Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex size-8 items-center justify-center rounded-xl text-xs font-black text-white"
                  style={{ backgroundColor: selectedCrypto.accentColor }}
                >
                  {selectedCrypto.ticker}
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[var(--tx)]">
                    {selectedCrypto.ticker} Deposit Invoice
                  </h3>
                  <p className="text-[11px] text-[var(--mut)]">
                    Network: {selectedCrypto.network}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="size-9 rounded-full bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)] flex items-center justify-center cursor-pointer"
                aria-label="Close invoice modal"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 flex items-center justify-between my-3">
              <div>
                <div className="text-[11px] font-medium text-[var(--mut)]">Amount Due</div>
                <div className="font-mono text-xl font-extrabold text-[var(--tx)] tabular-nums mt-0.5">
                  ${usdAmount} USD
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-medium text-[var(--mut)]">Allocation</div>
                <div className="font-mono text-base font-extrabold text-[#FFD60A] tabular-nums mt-0.5">
                  {formatPoints(oknFromUsd)} $OKN
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white my-3">
              <QrCode className="size-32 text-black" />
              <span className="text-[10px] font-bold text-zinc-600 mt-1.5 uppercase tracking-wider">
                Scan on {selectedCrypto.network} Network
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--mut)]">
                Deposit Address ({selectedCrypto.network})
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--line)] bg-[var(--s2)]">
                <span className="font-mono text-xs font-bold text-[var(--tx)] flex-1 truncate">
                  0x892aF21b76A93F424e75A0Bf9689874D14c9B231
                </span>
                <button
                  type="button"
                  onClick={copyInvoiceAddress}
                  className="h-8 px-3 rounded-lg bg-[#7A12F5] text-white text-xs font-bold shadow-xs hover:bg-[#8C38F7] cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                >
                  {invoiceCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  <span>{invoiceCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between text-xs text-[var(--mut)]">
              <span>
                Expires in <strong className="font-mono text-[var(--tx)]">14:52</strong>
              </span>
              <span className="font-medium text-[#2FBD8E]">Awaiting transfer</span>
            </div>

            <button
              type="button"
              onClick={() => void handleSimulateInvoicePaid()}
              className="mt-4 w-full h-11 rounded-xl bg-[#2FBD8E] text-black text-xs sm:text-sm font-extrabold shadow-md hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Simulate Deposit Confirmed (Demo)</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
