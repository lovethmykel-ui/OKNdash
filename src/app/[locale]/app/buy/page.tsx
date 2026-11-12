'use client';

/**
 * /app/buy — Clean, Straightforward $OKN Token Purchase Page.
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  QrCode,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseEther } from 'viem';
import { Link } from '@/i18n/navigation';
import { api, getDemoWalletAddress } from '@/lib/api/client';
import { formatPoints } from '@/lib/utils';
import { triggerConfetti } from '@/lib/confetti';
import { toast } from 'sonner';

type GatewayTab = 'deposit' | 'connect-wallet';

interface PaymentSuccessDetails {
  oknAmount: number;
  paidLabel: string;
  networkLabel: string;
  txRef: string;
}

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
  { id: 'sol', symbol: 'SOL', ticker: 'SOL', name: 'Solana', network: 'Solana', accentColor: '#14F195' },
  { id: 'bnb', symbol: 'BNB', ticker: 'BNB', name: 'BNB', network: 'BEP-20', accentColor: '#F3BA2F' },
];

function CryptoLogo({ ticker, className = 'size-8' }: { ticker: string; className?: string }) {
  switch (ticker) {
    case 'USDT':
      return (
        <svg viewBox="0 0 32 32" className={`${className} shrink-0`} fill="none">
          <circle cx="16" cy="16" r="16" fill="#26A17B" />
          <path
            d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"
            fill="#FFF"
          />
        </svg>
      );
    case 'BTC':
      return (
        <svg viewBox="0 0 32 32" className={`${className} shrink-0`} fill="none">
          <circle cx="16" cy="16" r="16" fill="#F7931A" />
          <path
            d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.919-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41l-1.257-.313-.852 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.842c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-.999 2.207-2.523zm-3.955 5.538c-.537 2.157-4.17 0.991-5.348.698l.954-3.825c1.178.294 4.956.879 4.394 3.127zm.535-5.568c-.49 1.964-3.521.966-4.503.722l.863-3.46c.982.244 4.151.699 3.64 2.738z"
            fill="#FFF"
          />
        </svg>
      );
    case 'ETH':
      return (
        <svg viewBox="0 0 32 32" className={`${className} shrink-0`} fill="none">
          <circle cx="16" cy="16" r="16" fill="#627EEA" />
          <path d="M16.498 6v7.39l6.248 2.79L16.498 6z" fill="#FFF" fillOpacity="0.6" />
          <path d="M16.498 6L10.25 16.18l6.248-2.79V6z" fill="#FFF" />
          <path d="M16.498 20.968v5.027L22.75 17.34l-6.252 3.628z" fill="#FFF" fillOpacity="0.6" />
          <path d="M16.498 25.995v-5.028L10.25 17.34l6.248 8.655z" fill="#FFF" />
          <path d="M16.498 19.807l6.248-3.627-6.248-2.79v6.417z" fill="#FFF" fillOpacity="0.2" />
          <path d="M10.25 16.18l6.248 3.627v-6.417l-6.248 2.79z" fill="#FFF" fillOpacity="0.6" />
        </svg>
      );
    case 'SOL':
      return (
        <svg viewBox="0 0 32 32" className={`${className} shrink-0`} fill="none">
          <circle cx="16" cy="16" r="16" fill="#1E1B2E" />
          <defs>
            <linearGradient id="solGradBuy" x1="8" y1="22" x2="24" y2="10" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9945FF" />
              <stop offset="0.5" stopColor="#14F195" />
              <stop offset="1" stopColor="#00C2FF" />
            </linearGradient>
          </defs>
          <path
            d="M9.9 20.4c.16-.16.38-.25.62-.25h12.66c.56 0 .84.68.44 1.08l-2.12 2.12c-.16.16-.38.25-.62.25H8.22c-.56 0-.84-.68-.44-1.08l2.12-2.12zm0-11.8c.16-.16.38-.25.62-.25h12.66c.56 0 .84.68.44 1.08l-2.12 2.12c-.16.16-.38.25-.62.25H8.22c-.56 0-.84-.68-.44-1.08L9.9 8.6zm12.2 5.75c-.16-.16-.38-.25-.62-.25H8.82c-.56 0-.84.68-.44 1.08l2.12 2.12c.16.16.38.25.62.25h12.66c.56 0 .84-.68.44-1.08l-2.12-2.12z"
            fill="url(#solGradBuy)"
          />
        </svg>
      );
    case 'BNB':
    default:
      return (
        <svg viewBox="0 0 32 32" className={`${className} shrink-0`} fill="none">
          <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
          <path
            d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6l-6.144 6.144 2.26 2.26zM6 16l2.26-2.26L10.52 16l-2.26 2.26L6 16zm6.116 1.596L16 21.48l3.886-3.886 2.26 2.259L16 26l-6.144-6.144-.003-.003 2.263-2.257zM21.48 16l2.26-2.26L26 16l-2.26 2.26L21.48 16zm-3.188-.002h.002L16 13.706 14.305 15.4l-.6.6 2.295 2.294 2.294-2.293-.002-.003z"
            fill="#FFF"
          />
        </svg>
      );
  }
}

export default function BuyPage() {
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

  // Animated Payment Success Modal State
  const [successDetails, setSuccessDetails] = useState<PaymentSuccessDetails | null>(null);

  const RATE_PER_BNB = 1_000_000; // 1 BNB = 1,000,000 $OKN ($0.00060)
  const BNB_USD_ESTIMATE = 600;

  const numBnb = parseFloat(bnbAmount) || 0;
  const totalOknFromBnb = Math.round(numBnb * RATE_PER_BNB);

  const numUsd = parseFloat(usdAmount) || 0;
  const oknFromUsd = Math.round((numUsd / BNB_USD_ESTIMATE) * RATE_PER_BNB);

  const fireSuccessFeedback = (details: PaymentSuccessDetails) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([15, 40, 25]);
    }
    triggerConfetti();
    setSuccessDetails(details);
  };

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
      fireSuccessFeedback({
        oknAmount: totalOknFromBnb,
        paidLabel: `${bnbAmount} BNB`,
        networkLabel: 'BNB Smart Chain (BEP-20)',
        txRef: `0x${activeAddress.slice(2, 8)}...${activeAddress.slice(-4)}`,
      });
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
    fireSuccessFeedback({
      oknAmount: oknFromUsd,
      paidLabel: `$${usdAmount} USD (${selectedCrypto.ticker})`,
      networkLabel: `${selectedCrypto.name} · ${selectedCrypto.network}`,
      txRef: `0x892aF2...c9B231`,
    });
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

  return (
    <main className="mx-auto max-w-[540px] space-y-4 pb-10">
      {/* 1. Simple, Clear Presale Header Card */}
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center rounded-full bg-[#7A12F5]/15 px-3 py-1 text-xs font-extrabold text-[var(--vio-l)]">
              Presale Stage 2
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--tx)]">
              Buy $OKN Token
            </h1>
          </div>
          <div className="text-right rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-3.5 py-2.5">
            <div className="text-[11px] font-bold text-[var(--mut)]">Token Price</div>
            <div className="num text-base sm:text-lg font-extrabold text-[var(--vio-l)] mt-0.5">
              $0.00060
            </div>
          </div>
        </div>

        {/* Clean Progress Bar */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[var(--mut)]">Stage 2 Progress</span>
            <span className="num text-[var(--tx)] font-extrabold">68.4% Sold</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[var(--s2)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7A12F5] via-[#9D4EDD] to-[#00C2FF]"
              style={{ width: '68.4%' }}
            />
          </div>
        </div>
      </section>

      {/* 2. Straightforward Purchase Card */}
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-5">
        {/* Payment Method Toggle */}
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
            className={`min-h-[44px] px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'deposit'
                ? 'bg-[#7A12F5] text-white shadow-[0_4px_14px_rgba(122,18,245,0.35)]'
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
            className={`min-h-[44px] px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'connect-wallet'
                ? 'bg-[#7A12F5] text-white shadow-[0_4px_14px_rgba(122,18,245,0.35)]'
                : 'text-[var(--mut)] hover:text-[var(--tx)]'
            }`}
          >
            <Wallet className="size-4 shrink-0" />
            <span>Connect Wallet</span>
          </button>
        </div>

        {activeTab === 'deposit' ? (
          <div className="space-y-4">
            {/* Currency Selection with Real Logos */}
            <div className="space-y-2.5">
              <div className="text-xs font-extrabold text-[var(--tx)]">
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
                      className={`min-h-[58px] px-3 py-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-[#7A12F5] bg-[#7A12F5]/12 text-[var(--tx)] ring-1 ring-[#7A12F5]/40 shadow-xs'
                          : 'border-[var(--line)] bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)]'
                      }`}
                    >
                      <CryptoLogo ticker={coin.ticker} className="size-8" />
                      <div className="min-w-0 leading-tight">
                        <div className="font-extrabold text-xs sm:text-sm text-[var(--tx)] whitespace-nowrap">
                          {coin.ticker}
                        </div>
                        <div className="text-[11px] font-semibold text-[var(--mut)] whitespace-nowrap mt-0.5">
                          {coin.network}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* You Pay Box */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 space-y-3">
              <div className="text-xs font-extrabold text-[var(--mut)]">
                You Pay (USD)
              </div>

              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center flex-1 min-w-0">
                  <span className="num text-2xl sm:text-3xl font-extrabold text-[var(--mut)] mr-1.5">$</span>
                  <input
                    type="number"
                    step="10"
                    min="30"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    placeholder="250"
                    aria-label="Contribution Amount (USD)"
                    className="w-full bg-transparent num text-2xl sm:text-3xl font-extrabold text-[var(--tx)] outline-none"
                  />
                </div>
                <span className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--s1)] px-3 py-1.5 text-xs font-extrabold text-[var(--tx)] whitespace-nowrap shadow-2xs">
                  <CryptoLogo ticker={selectedCrypto.ticker} className="size-4" />
                  <span>{selectedCrypto.ticker}</span>
                </span>
              </div>

              {/* Quick Amount Pills */}
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
                    className={`min-h-[38px] rounded-xl border num text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                      usdAmount === preset.val
                        ? 'border-[#7A12F5] bg-[#7A12F5] text-white shadow-xs'
                        : 'border-[var(--line)] bg-[var(--s1)] text-[var(--tx)] hover:border-[#7A12F5]/40'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Arrow Divider */}
            <div className="flex justify-center -my-2.5 relative z-10">
              <span className="flex size-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--s1)] text-[#7A12F5] shadow-xs">
                <ArrowDown className="size-4 stroke-[2.5]" />
              </span>
            </div>

            {/* You Receive Box — Clean, High Contrast in Light & Dark Mode */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4">
              <div className="text-xs font-extrabold text-[var(--mut)]">
                You Receive
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="num text-2xl sm:text-3xl font-extrabold text-[var(--vio-l)] whitespace-nowrap">
                  {formatPoints(oknFromUsd)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A12F5]/15 px-3 py-1.5 text-xs font-extrabold text-[var(--vio-l)] whitespace-nowrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/okn-logo.png" alt="$OKN" className="size-4 object-contain" />
                  <span>$OKN</span>
                </span>
              </div>
            </div>

            {/* Primary CTA Button */}
            <button
              type="button"
              onClick={handleGenerateInvoice}
              className="w-full h-12 rounded-2xl bg-[#7A12F5] hover:bg-[#8C38F7] text-white text-sm font-extrabold shadow-[0_8px_24px_rgba(122,18,245,0.35)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap px-4"
            >
              <QrCode className="size-4 shrink-0" />
              <span>Generate Deposit Invoice</span>
            </button>
          </div>
        ) : (
          /* =================== CONNECT WALLET BNB PANEL =================== */
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-4 py-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <CryptoLogo ticker="BNB" className="size-5" />
                <span className="font-bold text-[var(--mut)] truncate">Connected Wallet</span>
              </div>
              <span className="font-mono font-extrabold text-[var(--tx)] whitespace-nowrap">
                {shortAddr}
              </span>
            </div>

            {/* You Pay (BNB) */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 space-y-3">
              <div className="text-xs font-extrabold text-[var(--mut)]">
                You Pay (BNB)
              </div>

              <div className="relative flex items-center justify-between gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.05"
                  max="10"
                  value={bnbAmount}
                  onChange={(e) => setBnbAmount(e.target.value)}
                  placeholder="1.0"
                  aria-label="Enter BNB Amount"
                  className="w-full bg-transparent num text-2xl sm:text-3xl font-extrabold text-[var(--tx)] outline-none"
                />
                <span className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--s1)] px-3 py-1.5 text-xs font-extrabold text-[var(--tx)] whitespace-nowrap">
                  <CryptoLogo ticker="BNB" className="size-4" />
                  <span>BNB</span>
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {['0.1', '0.5', '1.0', '5.0'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBnbAmount(val)}
                    className={`min-h-[38px] rounded-xl border num text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                      bnbAmount === val
                        ? 'border-[#7A12F5] bg-[#7A12F5] text-white shadow-xs'
                        : 'border-[var(--line)] bg-[var(--s1)] text-[var(--tx)] hover:border-[#7A12F5]/40'
                    }`}
                  >
                    {val} BNB
                  </button>
                ))}
              </div>
            </div>

            {/* Arrow Divider */}
            <div className="flex justify-center -my-2.5 relative z-10">
              <span className="flex size-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--s1)] text-[#7A12F5] shadow-xs">
                <ArrowDown className="size-4 stroke-[2.5]" />
              </span>
            </div>

            {/* You Receive ($OKN) */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4">
              <div className="text-xs font-extrabold text-[var(--mut)]">
                You Receive
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="num text-2xl sm:text-3xl font-extrabold text-[var(--vio-l)] whitespace-nowrap">
                  {formatPoints(totalOknFromBnb)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A12F5]/15 px-3 py-1.5 text-xs font-extrabold text-[var(--vio-l)] whitespace-nowrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/okn-logo.png" alt="$OKN" className="size-4 object-contain" />
                  <span>$OKN</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleWeb3Buy}
              disabled={isSubmittingWeb3}
              className="w-full h-12 rounded-2xl bg-[#7A12F5] hover:bg-[#8C38F7] text-white text-sm font-extrabold shadow-[0_8px_24px_rgba(122,18,245,0.35)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap px-4 disabled:opacity-60"
            >
              <Zap className="size-4 shrink-0" />
              <span>
                {isSubmittingWeb3 ? 'Processing Swap...' : `Buy $OKN (${bnbAmount || '1.0'} BNB)`}
              </span>
            </button>
          </div>
        )}
      </section>

      {/* Deposit Invoice Modal */}
      {showInvoiceModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
            onClick={() => setShowInvoiceModal(false)}
          >
            <div
              className="w-full max-w-[380px] sm:max-w-[420px] rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.65)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <CryptoLogo ticker={selectedCrypto.ticker} className="size-9" />
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[var(--tx)] leading-tight">
                      {selectedCrypto.ticker} Deposit Invoice
                    </h3>
                    <p className="text-xs font-semibold text-[var(--mut)] mt-0.5">
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
                  ✕
                </button>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--mut)]">Amount Due</div>
                  <div className="num text-lg sm:text-xl font-extrabold text-[var(--tx)] mt-0.5">
                    ${usdAmount} USD
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-[var(--mut)]">You Receive</div>
                  <div className="num text-sm sm:text-base font-extrabold text-[var(--vio-l)] mt-0.5">
                    {formatPoints(oknFromUsd)} $OKN
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-4 px-3 rounded-2xl bg-white my-3.5 shadow-inner border border-[var(--line)]">
                <QrCode className="size-28 sm:size-32 text-black" />
                <span className="text-[11px] font-bold text-zinc-600 mt-1.5 uppercase tracking-wider">
                  Scan on {selectedCrypto.network}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--mut)]">
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

              <button
                type="button"
                onClick={() => void handleSimulateInvoicePaid()}
                className="mt-4 w-full h-11 rounded-xl bg-[#7A12F5] text-white text-xs sm:text-sm font-extrabold shadow-md hover:bg-[#8C38F7] active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Confirm Payment Sent</span>
              </button>
            </div>
          </div>,
          document.body,
        )}

      {/* Animated Payment Success Modal with Motion Blur */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {successDetails && (
              <motion.div
                key="payment-success-backdrop"
                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(18px)' }}
                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4"
                onClick={() => setSuccessDetails(null)}
              >
                <motion.div
                  key="payment-success-card"
                  initial={{
                    opacity: 0,
                    scale: 0.86,
                    y: 28,
                    scaleY: 1.1,
                    filter: 'blur(16px)',
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    scaleY: 1,
                    filter: 'blur(0px)',
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.94,
                    y: 14,
                    filter: 'blur(10px)',
                  }}
                  transition={{
                    type: 'spring',
                    bounce: 0.24,
                    duration: 0.48,
                  }}
                  style={{ willChange: 'transform, opacity, filter' }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-[380px] overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--s1)] p-6 sm:p-7 text-center shadow-[0_32px_80px_rgba(0,0,0,0.68)]"
                >
                  {/* Subtle top ambient glow */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-52 rounded-full bg-[#10B981]/20 blur-3xl"
                  />

                  {/* Animated Checkmark Badge with Motion Blur & Shockwave Rings */}
                  <div className="relative mx-auto mb-4 flex size-20 items-center justify-center">
                    {/* Expanding Motion-Blurred Shockwave Ring 1 */}
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0.8, filter: 'blur(1px)' }}
                      animate={{ scale: 1.75, opacity: 0, filter: 'blur(10px)' }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.08 }}
                      className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#10B981]"
                    />
                    {/* Expanding Motion-Blurred Shockwave Ring 2 */}
                    <motion.div
                      initial={{ scale: 0.75, opacity: 0.55, filter: 'blur(2px)' }}
                      animate={{ scale: 2.05, opacity: 0, filter: 'blur(14px)' }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.14 }}
                      className="pointer-events-none absolute inset-0 rounded-full bg-[#10B981]/25"
                    />

                    {/* Main Emblem Disc with Velocity Stretch + Motion Blur */}
                    <motion.div
                      initial={{
                        scale: 0.4,
                        scaleY: 1.35,
                        scaleX: 0.76,
                        y: 22,
                        filter: 'blur(14px)',
                      }}
                      animate={{
                        scale: [0.4, 1.07, 1],
                        scaleY: [1.35, 0.93, 1],
                        scaleX: [0.76, 1.05, 1],
                        y: [22, -3, 0],
                        filter: ['blur(14px)', 'blur(3px)', 'blur(0px)'],
                      }}
                      transition={{
                        duration: 0.5,
                        times: [0, 0.68, 1],
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{ willChange: 'transform, filter' }}
                      className="relative flex size-[72px] items-center justify-center rounded-full border border-white/25 bg-gradient-to-b from-[#10B981] to-[#059669] shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_12px_32px_rgba(16,185,129,0.42)] ring-4 ring-[#10B981]/15"
                    >
                      <svg
                        viewBox="0 0 52 52"
                        className="size-10 overflow-visible"
                        fill="none"
                        aria-hidden="true"
                      >
                        <defs>
                          <filter
                            id="checkmark-motion-blur"
                            x="-40%"
                            y="-40%"
                            width="180%"
                            height="180%"
                          >
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3.2 1.1" />
                          </filter>
                        </defs>

                        {/* Motion-Blurred Velocity Trail Stroke */}
                        <motion.path
                          d="M14.5 27.5L22.5 35.5L38 18"
                          stroke="#A7F3D0"
                          strokeWidth="6.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#checkmark-motion-blur)"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{
                            pathLength: [0, 1, 1],
                            opacity: [0, 0.95, 0],
                            x: [-4, 0, 1],
                          }}
                          transition={{
                            duration: 0.52,
                            times: [0, 0.6, 1],
                            delay: 0.12,
                            ease: 'easeOut',
                          }}
                        />

                        {/* Crisp Foreground Checkmark Stroke */}
                        <motion.path
                          d="M14.5 27.5L22.5 35.5L38 18"
                          stroke="#FFFFFF"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0, opacity: 0, filter: 'blur(6px)' }}
                          animate={{
                            pathLength: 1,
                            opacity: 1,
                            filter: 'blur(0px)',
                          }}
                          transition={{
                            pathLength: {
                              type: 'spring',
                              bounce: 0.15,
                              duration: 0.46,
                              delay: 0.14,
                            },
                            opacity: { duration: 0.15, delay: 0.14 },
                            filter: { duration: 0.34, delay: 0.16 },
                          }}
                        />
                      </svg>
                    </motion.div>
                  </div>

                  {/* Clean Headline & Hero Token Amount */}
                  <motion.div
                    initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.36, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--tx)]">
                      Payment Successful
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm font-medium text-[var(--mut)]">
                      Credited directly to your $OKN portfolio
                    </p>

                    {/* Centered Hero Credited Amount */}
                    <div className="mt-4 inline-flex items-center justify-center gap-2.5 rounded-2xl border border-[#7A12F5]/25 bg-[#7A12F5]/10 px-5 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/okn-logo.png" alt="$OKN" className="size-6 object-contain" />
                      <span className="num text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--tx)]">
                        +{formatPoints(successDetails.oknAmount)}
                      </span>
                      <span className="text-sm font-extrabold text-[var(--vio-l)]">$OKN</span>
                    </div>
                  </motion.div>

                  {/* Clean Receipt Summary Rows */}
                  <motion.div
                    initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.38, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-5 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-4 py-1 text-xs"
                  >
                    <div className="flex items-center justify-between py-2.5">
                      <span className="font-semibold text-[var(--mut)]">Amount Paid</span>
                      <span className="num font-extrabold text-[var(--tx)]">
                        {successDetails.paidLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span className="font-semibold text-[var(--mut)]">Network</span>
                      <span className="font-bold text-[var(--tx)]">
                        {successDetails.networkLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span className="font-semibold text-[var(--mut)]">Status</span>
                      <span className="inline-flex items-center gap-1.5 font-extrabold text-[#10B981]">
                        <span className="size-1.5 rounded-full bg-[#10B981]" />
                        <span>Completed</span>
                      </span>
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.34, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-5 grid grid-cols-2 gap-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => setSuccessDetails(null)}
                      className="h-11 rounded-2xl border border-[var(--line)] bg-[var(--s2)] hover:bg-[var(--s3)] text-xs sm:text-sm font-extrabold text-[var(--tx)] active:scale-[0.97] transition-all cursor-pointer"
                    >
                      Buy More
                    </button>
                    <Link
                      href="/app/portfolio"
                      onClick={() => setSuccessDetails(null)}
                      className="h-11 rounded-2xl bg-[#7A12F5] hover:bg-[#8C38F7] text-white text-xs sm:text-sm font-extrabold shadow-[0_8px_24px_rgba(122,18,245,0.35)] active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>View Portfolio</span>
                      <ArrowRight className="size-4 shrink-0" />
                    </Link>
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
