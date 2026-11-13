'use client';

/**
 * /app/buy — Streamlined $OKN Presale Gateway.
 *
 * Clean, high-contrast crypto purchase experience for mobile and desktop:
 *   - Compact Stage 2 header with Token Price & Stage Progress bar
 *   - Segmented Deposit / Connect Wallet switcher
 *   - Multi-currency selector with authentic vector crypto badges
 *   - Focused Deposit Invoice modal & motion-blur Payment Successful screen
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from '@/i18n/navigation';
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  QrCode,
  ShieldCheck,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseEther } from 'viem';
import { api, getDemoWalletAddress } from '@/lib/api/client';
import { formatPoints } from '@/lib/utils';
import { triggerConfetti } from '@/lib/confetti';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { OknWatermark } from '@/components/ui/okn-watermark';
import { toast } from 'sonner';

type GatewayTab = 'deposit' | 'connect-wallet';

interface CryptoOption {
  id: string;
  ticker: 'USDT' | 'BTC' | 'ETH' | 'SOL' | 'BNB';
  name: string;
  network: string;
}

const CRYPTO_OPTIONS: CryptoOption[] = [
  { id: 'usdt-bsc', ticker: 'USDT', name: 'Tether', network: 'BEP-20' },
  { id: 'usdt-trx', ticker: 'USDT', name: 'Tether', network: 'TRC-20' },
  { id: 'btc', ticker: 'BTC', name: 'Bitcoin', network: 'Bitcoin' },
  { id: 'eth', ticker: 'ETH', name: 'Ethereum', network: 'ERC-20' },
  { id: 'sol', ticker: 'SOL', name: 'Solana', network: 'Solana' },
  { id: 'bnb', ticker: 'BNB', name: 'BNB', network: 'BEP-20' },
];

const QUICK_USD = [
  { label: '$50', val: '50' },
  { label: '$100', val: '100' },
  { label: '$250', val: '250' },
  { label: '$500', val: '500' },
  { label: '$1K', val: '1000' },
];

const HOW_TO_STEPS = [
  {
    step: '01',
    title: 'Choose currency',
    body: 'Select USDT, BTC, ETH, SOL, BNB, or pay directly with your connected BSC wallet.',
  },
  {
    step: '02',
    title: 'Enter purchase amount',
    body: 'Pick a preset or enter a custom USD/BNB amount to preview your $OKN allocation.',
  },
  {
    step: '03',
    title: 'Complete transfer',
    body: 'Scan the QR code or copy the deposit address from your exchange or wallet.',
  },
  {
    step: '04',
    title: 'Instant portfolio credit',
    body: 'Your $OKN tokens appear directly in your portfolio upon confirmation.',
  },
];

function CryptoBadge({ ticker, size = 'md' }: { ticker: CryptoOption['ticker']; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'size-5' : size === 'lg' ? 'size-10' : 'size-8';
  const iconDim = size === 'sm' ? 'size-3' : size === 'lg' ? 'size-5' : 'size-4';

  if (ticker === 'USDT') {
    return (
      <span className={`${dim} rounded-full bg-[#26A17B] text-white flex items-center justify-center shrink-0 shadow-xs`}>
        <svg viewBox="0 0 24 24" className={iconDim} fill="currentColor" aria-hidden="true">
          <path d="M13.2 10.6V8.5h4.6V5.8H6.2v2.7h4.6v2.1c-3.6.2-6.3 1-6.3 2s2.7 1.8 6.3 2v4.6h2.4v-4.6c3.6-.2 6.3-1 6.3-2s-2.7-1.8-6.3-2zm-1.2 3.3c-3.1 0-5.4-.6-5.4-1.3 0-.6 1.9-1.1 4.4-1.2v1.6c.3 0 .7.1 1 .1s.7 0 1-.1v-1.6c2.5.1 4.4.6 4.4 1.2 0 .7-2.3 1.3-5.4 1.3z" />
        </svg>
      </span>
    );
  }

  if (ticker === 'BTC') {
    return (
      <span className={`${dim} rounded-full bg-[#F7931A] text-white flex items-center justify-center shrink-0 shadow-xs`}>
        <svg viewBox="0 0 24 24" className={iconDim} fill="currentColor" aria-hidden="true">
          <path d="M15.4 11.4c1-.5 1.6-1.4 1.4-2.6-.2-1.5-1.4-2.2-3.2-2.4V4.5h-1.4v1.8h-1.1V4.5H9.7v1.8H7.2v1.5h1c.5 0 .7.2.7.6v7.1c0 .4-.2.6-.7.6h-1v1.6h2.5v1.8h1.4v-1.8h1.1v1.8h1.4v-1.8c2.4-.2 4-1 4.2-3.1.2-1.4-.5-2.6-2.4-3.2zm-4.1-3.5c1.1 0 2.5.2 2.5 1.4 0 1.2-1.4 1.5-2.5 1.5V7.9zm.4 7.9h-.4v-3.2h.5c1.3 0 2.9.2 2.9 1.6s-1.6 1.6-3 1.6z" />
        </svg>
      </span>
    );
  }

  if (ticker === 'ETH') {
    return (
      <span className={`${dim} rounded-full bg-[#627EEA] text-white flex items-center justify-center shrink-0 shadow-xs`}>
        <svg viewBox="0 0 24 24" className={iconDim} fill="currentColor" aria-hidden="true">
          <path d="M12 3L6.5 12.2 12 15.4l5.5-3.2L12 3zm0 13.6L6.5 13.4 12 21l5.5-7.6-5.5 3.2z" />
        </svg>
      </span>
    );
  }

  if (ticker === 'SOL') {
    return (
      <span className={`${dim} rounded-full bg-[#14161D] border border-white/15 flex items-center justify-center shrink-0 shadow-xs`}>
        <svg viewBox="0 0 24 24" className={iconDim} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="sol-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00FFA3" />
              <stop offset="100%" stopColor="#DC1FFF" />
            </linearGradient>
          </defs>
          <path d="M6.5 7.5h10.2l1.8-2H8.3l-1.8 2zm11 3.5H7.3l-1.8 2h10.2l1.8-2zm-11 5.5h10.2l1.8-2H8.3l-1.8 2z" fill="url(#sol-grad)" />
        </svg>
      </span>
    );
  }

  return (
    <span className={`${dim} rounded-full bg-[#F3BA2F] text-white flex items-center justify-center shrink-0 shadow-xs`}>
      <svg viewBox="0 0 24 24" className={iconDim} fill="currentColor" aria-hidden="true">
        <path d="M12 4.5l3.2 3.2-1.4 1.4L12 7.3l-1.8 1.8-1.4-1.4L12 4.5zm-5.5 5.5L8 11.5 6.5 13 5 11.5 6.5 10zm11 0L19 11.5 17.5 13 16 11.5 17.5 10zM12 9.8l2.2 2.2L12 14.2 9.8 12 12 9.8zm0 6.9l1.8-1.8 1.4 1.4L12 19.5l-3.2-3.2 1.4-1.4 1.8 1.8z" />
      </svg>
    </span>
  );
}

interface SuccessReceipt {
  oknAmount: number;
  paidLabel: string;
  networkLabel: string;
}

export default function BuyPage() {
  const router = useRouter();
  const { address } = useAccount();
  const qc = useQueryClient();
  const activeAddress = address ?? getDemoWalletAddress();
  const shortAddr = `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`;

  const [activeTab, setActiveTab] = useState<GatewayTab>('deposit');

  // Web3 BNB State
  const [bnbAmount, setBnbAmount] = useState('1.0');
  const [isSubmittingWeb3, setIsSubmittingWeb3] = useState(false);

  // Crypto Deposit State
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption>(CRYPTO_OPTIONS[0]);
  const [usdAmount, setUsdAmount] = useState('250');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceCopied, setInvoiceCopied] = useState(false);

  // Payment Successful Modal State
  const [successReceipt, setSuccessReceipt] = useState<SuccessReceipt | null>(null);

  const RATE_PER_BNB = 1_000_000;
  const BNB_USD_ESTIMATE = 600;

  const numBnb = parseFloat(bnbAmount) || 0;
  const oknFromBnb = Math.round(numBnb * RATE_PER_BNB);

  const numUsd = parseFloat(usdAmount) || 0;
  const oknFromUsd = Math.round((numUsd / BNB_USD_ESTIMATE) * RATE_PER_BNB);

  const depositAddress = '0x892aF21b76A93F424e75A0Bf9689874D14c9B231';

  const handleWeb3Buy = () => {
    if (numBnb <= 0) {
      toast.error('Please enter a valid BNB amount');
      return;
    }

    setIsSubmittingWeb3(true);
    setTimeout(async () => {
      const bnbWei = parseEther(String(numBnb));
      const oknWei = BigInt(oknFromBnb) * 10n ** 18n;
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
      setSuccessReceipt({
        oknAmount: oknFromBnb,
        paidLabel: `${bnbAmount} BNB`,
        networkLabel: 'BNB Smart Chain',
      });
    }, 650);
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
    setSuccessReceipt({
      oknAmount: oknFromUsd,
      paidLabel: `$${usdAmount} USD (${selectedCrypto.ticker})`,
      networkLabel: `${selectedCrypto.name} · ${selectedCrypto.network}`,
    });
  };

  const copyInvoiceAddress = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
      setInvoiceCopied(true);
      toast.success('Deposit address copied!');
      setTimeout(() => setInvoiceCopied(false), 2000);
    } catch {
      toast.info('Address copied');
    }
  };

  return (
    <main className="space-y-5 md:space-y-6 pb-10">
      {/* 1. Compact Stage 2 Presale Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm">
        <OknWatermark variant="tinted" size="md" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-[#7A12F5]/20 border border-[#7A12F5]/30 px-3 py-1 text-xs font-bold text-[#7A12F5] dark:text-[#C084FC]">
              Presale Stage 2
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--tx)]">
              Buy $OKN Token
            </h1>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)]/90 backdrop-blur-sm px-4 py-2.5 text-right shrink-0">
            <div className="text-[11px] font-semibold text-[var(--mut)] whitespace-nowrap">
              Token Price
            </div>
            <div className="font-mono text-base sm:text-lg font-extrabold text-[#7A12F5] dark:text-[#C084FC] tabular-nums mt-0.5 whitespace-nowrap">
              $0.00060
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--mut)]">Stage 2 Progress</span>
            <span className="font-bold text-[var(--tx)] tabular-nums">68.4% Sold</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[var(--s2)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7A12F5] via-[#8E2BFF] to-[#00C2FF]"
              style={{ width: '68.4%' }}
            />
          </div>
        </div>
      </section>

      {/* 2. Main Split Grid: Purchase Widget (Left) + Simple Guide (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
        <div className="lg:col-span-7 rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-6 shadow-sm space-y-5">
          {/* Segmented Payment Switcher */}
          <div
            role="tablist"
            aria-label="Payment method"
            className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl border border-[var(--line)] bg-[var(--s2)]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'deposit'}
              onClick={() => setActiveTab('deposit')}
              className={`min-h-[44px] px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === 'deposit'
                  ? 'bg-gradient-to-r from-[#7A12F5] to-[#8C38F7] text-white shadow-[0_4px_14px_rgba(122,18,245,0.4)]'
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
              className={`min-h-[44px] px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === 'connect-wallet'
                  ? 'bg-gradient-to-r from-[#7A12F5] to-[#8C38F7] text-white shadow-[0_4px_14px_rgba(122,18,245,0.4)]'
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
              {/* Currency Selector */}
              <div className="space-y-2.5">
                <div className="text-sm font-bold text-[var(--tx)]">
                  Select Currency
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {CRYPTO_OPTIONS.map((coin) => {
                    const isSelected = selectedCrypto.id === coin.id;
                    return (
                      <button
                        key={coin.id}
                        type="button"
                        onClick={() => setSelectedCrypto(coin)}
                        className={`min-h-[58px] px-2.5 py-2 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'border-[#7A12F5] bg-[#7A12F5]/14 text-[var(--tx)] shadow-[0_0_0_1px_rgba(122,18,245,0.35)]'
                            : 'border-[var(--line)] bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)]'
                        }`}
                      >
                        <CryptoBadge ticker={coin.ticker} size="md" />
                        <div className="min-w-0 leading-tight">
                          <div className="font-extrabold text-xs text-[var(--tx)] whitespace-nowrap">
                            {coin.ticker}
                          </div>
                          <div className="text-[11px] font-medium text-[var(--mut)] whitespace-nowrap">
                            {coin.network}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* You Pay Box */}
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 space-y-3.5">
                <div className="text-xs font-semibold text-[var(--mut)]">
                  You Pay (USD)
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="text-2xl font-extrabold text-[var(--mut)] mr-1.5">$</span>
                    <input
                      type="number"
                      step="10"
                      min="10"
                      value={usdAmount}
                      onChange={(e) => setUsdAmount(e.target.value)}
                      placeholder="250"
                      aria-label="Contribution Amount (USD)"
                      className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold text-[var(--tx)] tabular-nums outline-none"
                    />
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--s1)] px-3 py-1.5 text-xs font-extrabold text-[var(--tx)] whitespace-nowrap shadow-xs">
                    <CryptoBadge ticker={selectedCrypto.ticker} size="sm" />
                    <span>{selectedCrypto.ticker}</span>
                  </span>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-5 gap-2">
                  {QUICK_USD.map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setUsdAmount(preset.val)}
                      className={`min-h-[38px] rounded-xl border text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                        usdAmount === preset.val
                          ? 'border-[#7A12F5] bg-[#7A12F5] text-white shadow-[0_2px_10px_rgba(122,18,245,0.4)]'
                          : 'border-[var(--line)] bg-[var(--s1)] text-[var(--tx)]/80 hover:text-[var(--tx)]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Circular Down Arrow Divider */}
              <div className="flex justify-center -my-3 relative z-10">
                <span className="flex size-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--s2)] text-[#7A12F5] dark:text-[#C084FC] shadow-sm">
                  <ArrowDown className="size-4" />
                </span>
              </div>

              {/* You Receive Box */}
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 space-y-2">
                <div className="text-xs font-semibold text-[var(--mut)]">
                  You Receive
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#7A12F5] dark:text-[#C084FC] tabular-nums whitespace-nowrap">
                    {formatPoints(oknFromUsd)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#7A12F5]/30 bg-[#7A12F5]/15 px-3 py-1.5 text-xs font-extrabold text-[var(--tx)] whitespace-nowrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/okn-logo.png" alt="$OKN" className="size-5 rounded-full object-contain" />
                    <span>$OKN</span>
                  </span>
                </div>
              </div>

              {/* Primary CTA Button */}
              <button
                type="button"
                onClick={handleGenerateInvoice}
                className="w-full h-12 sm:h-[52px] rounded-2xl bg-gradient-to-r from-[#7A12F5] to-[#8C38F7] text-white text-sm sm:text-base font-extrabold shadow-[0_6px_20px_rgba(122,18,245,0.4)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2.5 whitespace-nowrap px-4"
              >
                <QrCode className="size-5 shrink-0" />
                <span>Generate Deposit Invoice</span>
              </button>
            </div>
          ) : (
            /* =================== WEB3 WALLET PANEL =================== */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-4 py-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Wallet className="size-4 text-[#F3BA2F] shrink-0" />
                  <span className="font-semibold text-[var(--mut)] truncate">Connected Wallet</span>
                </div>
                <span className="font-mono font-bold text-[var(--tx)] whitespace-nowrap">
                  {shortAddr} · BSC
                </span>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 space-y-3.5">
                <div className="text-xs font-semibold text-[var(--mut)]">
                  You Pay (BNB)
                </div>

                <div className="flex items-center justify-between gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="25"
                    value={bnbAmount}
                    onChange={(e) => setBnbAmount(e.target.value)}
                    placeholder="1.0"
                    aria-label="Enter BNB Amount"
                    className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold text-[var(--tx)] tabular-nums outline-none"
                  />
                  <span className="shrink-0 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--s1)] px-3 py-1.5 text-xs font-extrabold text-[var(--tx)] whitespace-nowrap">
                    <CryptoBadge ticker="BNB" size="sm" />
                    <span>BNB</span>
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {['0.1', '0.5', '1.0', '5.0'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBnbAmount(val)}
                      className={`min-h-[38px] rounded-xl border text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                        bnbAmount === val
                          ? 'border-[#7A12F5] bg-[#7A12F5] text-white shadow-[0_2px_10px_rgba(122,18,245,0.4)]'
                          : 'border-[var(--line)] bg-[var(--s1)] text-[var(--tx)]/80 hover:text-[var(--tx)]'
                      }`}
                    >
                      {val} BNB
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center -my-3 relative z-10">
                <span className="flex size-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--s2)] text-[#7A12F5] dark:text-[#C084FC] shadow-sm">
                  <ArrowDown className="size-4" />
                </span>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 space-y-2">
                <div className="text-xs font-semibold text-[var(--mut)]">
                  You Receive
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#7A12F5] dark:text-[#C084FC] tabular-nums whitespace-nowrap">
                    {formatPoints(oknFromBnb)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#7A12F5]/30 bg-[#7A12F5]/15 px-3 py-1.5 text-xs font-extrabold text-[var(--tx)] whitespace-nowrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/okn-logo.png" alt="$OKN" className="size-5 rounded-full object-contain" />
                    <span>$OKN</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWeb3Buy}
                disabled={isSubmittingWeb3}
                className="w-full h-12 sm:h-[52px] rounded-2xl bg-gradient-to-r from-[#7A12F5] to-[#8C38F7] text-white text-sm sm:text-base font-extrabold shadow-[0_6px_20px_rgba(122,18,245,0.4)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap px-4 disabled:opacity-60"
              >
                <Zap className="size-5 shrink-0" />
                <span>
                  {isSubmittingWeb3 ? 'Confirming Purchase...' : `Buy $OKN (${bnbAmount || '1.0'} BNB)`}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Clean How-To Steps */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-[var(--tx)]">How to Buy</h2>

            <ol className="divide-y divide-[var(--line)]">
              {HOW_TO_STEPS.map((item) => (
                <li key={item.step} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                  <span className="font-mono text-xs font-extrabold text-[#7A12F5] dark:text-[#C084FC] bg-[#7A12F5]/15 rounded-xl size-7 shrink-0 flex items-center justify-center mt-0.5">
                    {item.step}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[var(--tx)]">{item.title}</h3>
                    <p className="text-xs text-[var(--mut)] leading-relaxed mt-0.5">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="flex items-start gap-2.5 pt-3 border-t border-[var(--line)] text-xs text-[var(--mut)]">
              <ShieldCheck className="size-4 text-[#10B981] shrink-0 mt-0.5" />
              <span>Tokens settle directly into your portfolio with zero vesting lockup.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Deposit Invoice Modal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showInvoiceModal && (
              <motion.div
                key="invoice-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                onClick={() => setShowInvoiceModal(false)}
              >
                <motion.div
                  key="invoice-dialog"
                  initial={{ opacity: 0, scale: 0.9, y: 22, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.94, y: 12, filter: 'blur(8px)' }}
                  transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-[390px] rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.75)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <CryptoBadge ticker={selectedCrypto.ticker} size="lg" />
                      <div>
                        <h3 className="text-base font-extrabold text-[var(--tx)] leading-tight">
                          {selectedCrypto.ticker} Deposit Invoice
                        </h3>
                        <p className="text-xs font-medium text-[var(--mut)] mt-0.5">
                          Network: {selectedCrypto.network}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInvoiceModal(false)}
                      className="size-8 rounded-full bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)] flex items-center justify-center cursor-pointer transition-colors"
                      aria-label="Close invoice modal"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Amount Summary Box */}
                  <motion.div
                    initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.08, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-4 py-3.5 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-medium text-[var(--mut)]">Amount Due</div>
                      <div className="text-lg sm:text-xl font-extrabold text-[var(--tx)] tabular-nums mt-0.5">
                        ${usdAmount} USD
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-[var(--mut)]">You Receive</div>
                      <div className="text-base sm:text-lg font-extrabold text-[#7A12F5] dark:text-[#C084FC] tabular-nums mt-0.5">
                        {formatPoints(oknFromUsd)} $OKN
                      </div>
                    </div>
                  </motion.div>

                  {/* White QR Container */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ delay: 0.14, duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center justify-center py-6 px-4 rounded-2xl bg-white my-4 shadow-inner"
                  >
                    <QrCode className="size-32 sm:size-36 text-[#0A0A0C]" strokeWidth={1.75} />
                    <span className="text-[11px] font-bold text-zinc-500 mt-3 uppercase tracking-[0.14em]">
                      SCAN ON {selectedCrypto.network.toUpperCase()}
                    </span>
                  </motion.div>

                  {/* Deposit Address Row */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--mut)]">
                      Deposit Address ({selectedCrypto.network})
                    </label>
                    <div className="flex items-center gap-2 p-2 pl-3.5 rounded-2xl border border-[var(--line)] bg-[var(--s2)]">
                      <span className="font-mono text-xs font-bold text-[var(--tx)] flex-1 truncate">
                        {depositAddress}
                      </span>
                      <button
                        type="button"
                        onClick={copyInvoiceAddress}
                        className="h-9 px-3.5 rounded-xl bg-[#7A12F5] text-white text-xs font-bold shadow-xs hover:bg-[#8C38F7] cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        {invoiceCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        <span>{invoiceCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Confirm CTA */}
                  <button
                    type="button"
                    onClick={() => void handleSimulateInvoicePaid()}
                    className="mt-4 w-full h-12 rounded-2xl bg-gradient-to-r from-[#7A12F5] to-[#8C38F7] text-white text-sm font-extrabold shadow-[0_6px_20px_rgba(122,18,245,0.4)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <CheckCircle2 className="size-4.5 shrink-0" />
                    <span>Confirm Payment Sent</span>
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* 4. Payment Successful Modal with Animated Motion-Blur Checkmark & Soft-Blur Token Counter */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {successReceipt && (
              <motion.div
                key="success-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                onClick={() => setSuccessReceipt(null)}
              >
                <motion.div
                  key="success-dialog"
                  initial={{ opacity: 0, scale: 0.86, y: 26, filter: 'blur(14px)' }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.94, y: 14, filter: 'blur(8px)' }}
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                  className="relative overflow-hidden w-full max-w-[390px] rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-6 text-center shadow-[0_24px_72px_rgba(0,0,0,0.8)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Animated Green Checkmark Circle with Velocity Motion Blur */}
                  <div className="relative mx-auto flex size-22 items-center justify-center">
                    {/* Expanding blurred aura shockwave */}
                    <motion.span
                      aria-hidden="true"
                      initial={{ scale: 0.5, opacity: 0.85, filter: 'blur(4px)' }}
                      animate={{ scale: 1.65, opacity: 0, filter: 'blur(14px)' }}
                      transition={{ delay: 0.14, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                      className="pointer-events-none absolute inset-1 rounded-full bg-[#10B981]/45"
                    />

                    {/* Outer translucent halo */}
                    <motion.div
                      initial={{ scale: 0.65, opacity: 0, filter: 'blur(8px)' }}
                      animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                      transition={{ delay: 0.04, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                      className="flex size-20 items-center justify-center rounded-full bg-[#10B981]/15 border border-[#10B981]/30"
                    >
                      {/* Inner emerald circle */}
                      <motion.div
                        initial={{ scale: 0.35, opacity: 0, rotate: -18, filter: 'blur(10px)' }}
                        animate={{
                          scale: [0.35, 1.08, 1],
                          opacity: 1,
                          rotate: 0,
                          filter: ['blur(10px)', 'blur(2px)', 'blur(0px)'],
                        }}
                        transition={{ delay: 0.08, duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                        className="relative flex size-14 items-center justify-center rounded-full bg-[#10B981] text-white shadow-[0_0_32px_rgba(16,185,129,0.6)]"
                      >
                        {/* Blurred motion-trail checkmark behind crisp stroke */}
                        <motion.svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="pointer-events-none absolute size-7 text-emerald-100"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3.6}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ opacity: 0.7, filter: 'blur(5px)', scale: 1.12 }}
                          animate={{ opacity: 0, filter: 'blur(9px)', scale: 1 }}
                          transition={{ delay: 0.22, duration: 0.45, ease: 'easeOut' }}
                        >
                          <motion.path
                            d="M5 13l4 4L19 7"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.18, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </motion.svg>

                        {/* Crisp primary checkmark drawing in with velocity motion blur */}
                        <motion.svg
                          viewBox="0 0 24 24"
                          className="relative z-10 size-7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ filter: 'blur(5px)', scale: 0.85 }}
                          animate={{
                            filter: ['blur(5px)', 'blur(1.5px)', 'blur(0px)'],
                            scale: [0.85, 1.06, 1],
                          }}
                          transition={{ delay: 0.2, duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <motion.path
                            d="M5 13l4 4L19 7"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{
                              pathLength: { delay: 0.22, duration: 0.36, ease: [0.22, 1, 0.36, 1] },
                              opacity: { delay: 0.2, duration: 0.14 },
                            }}
                          />
                        </motion.svg>
                      </motion.div>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.18, duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-[var(--tx)]">
                      Payment Successful
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-[var(--mut)]">
                      Credited directly to your $OKN portfolio
                    </p>
                  </motion.div>

                  {/* Credited Token Pill with Soft-Blur Animated Counter */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 12, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.24, duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-5 inline-flex items-center justify-center gap-2.5 rounded-2xl border border-[#7A12F5]/35 bg-[#7A12F5]/14 px-5 py-3 shadow-[0_0_24px_rgba(122,18,245,0.18)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/okn-logo.png" alt="$OKN" className="size-7 rounded-full object-contain" />
                    <AnimatedCounter
                      key={successReceipt.oknAmount}
                      target={successReceipt.oknAmount}
                      prefix="+"
                      durationMs={1050}
                      className="text-2xl font-extrabold text-[var(--tx)] tabular-nums"
                    />
                    <span className="text-sm font-extrabold text-[#7A12F5] dark:text-[#C084FC]">
                      $OKN
                    </span>
                  </motion.div>

                  {/* Clean Receipt Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.32, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--s2)] divide-y divide-[var(--line)] text-xs sm:text-sm text-left"
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[var(--mut)]">Amount Paid</span>
                      <span className="font-bold text-[var(--tx)]">{successReceipt.paidLabel}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[var(--mut)]">Network</span>
                      <span className="font-bold text-[var(--tx)]">{successReceipt.networkLabel}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[var(--mut)]">Status</span>
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#10B981]">
                        <span className="size-2 rounded-full bg-[#10B981]" />
                        Completed
                      </span>
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.38, duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-5 grid grid-cols-2 gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => setSuccessReceipt(null)}
                      className="h-11 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-xs sm:text-sm font-bold text-[var(--tx)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
                    >
                      Buy More
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSuccessReceipt(null);
                        router.push('/app/portfolio' as never);
                      }}
                      className="h-11 rounded-xl bg-gradient-to-r from-[#7A12F5] to-[#8C38F7] text-white text-xs sm:text-sm font-extrabold shadow-[0_4px_16px_rgba(122,18,245,0.4)] hover:brightness-110 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <span>View Portfolio</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </main>
  );
}

