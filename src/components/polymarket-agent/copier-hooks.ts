'use client';

/**
 * polymarket-agent/copier-hooks.ts — Client-side interactive demo store
 * for the Polymarket Copy Agent, Subscriptions, Executions, and Funds panels.
 */

export interface CopierWallet {
  id: string;
  address: string;
  proxyWallet: string;
  origin: 'created' | 'imported_eoa' | 'imported_safe_owner';
  signatureType: 'eoa' | 'poly_gnosis_safe';
  status: string;
  createdAt?: string;
}

export interface CopierSubscription {
  id: string;
  traderAddress: string;
  status: 'preview' | 'live' | 'paused' | 'stopped';
  strategyConfig: {
    strategy: 'PERCENTAGE' | 'FIXED' | 'ADAPTIVE';
    copySize: number;
    maxOrderSizeUsd: number;
    minOrderSizeUsd: number;
  };
  createdAt?: string;
}

export interface CopierExecution {
  id: string;
  status: string;
  market: { asset?: string; slug?: string; side?: string };
  traderUsdcSize: string | number;
  sizing?: { finalAmount?: number; reasoning?: string } | null;
  createdAt?: string;
}

export interface CopierApiError {
  code: string;
  message: string;
}

export interface ExportedKey {
  privateKey: string;
  address: string;
}

export interface AllowlistAddress {
  id: string;
  address: string;
  label: string | null;
  effectiveAfter: string;
}

export interface Withdrawal {
  id: string;
  amountUsdc: string;
  status: 'requested' | 'executing' | 'done' | 'failed' | 'canceled';
  address: string;
  txHash: string | null;
  requestedAt: string;
  processedAt: string | null;
}

export interface CopierBalances {
  address: string;
  usdc: string;
  pol: string;
  allowance: { usdcApproved: boolean; checkedAt: string } | null;
  openTokens: string;
  updatedAt: string;
}

export interface CopierFeeSummary {
  accruedUsdc: string;
  settledUsdc: string;
  waivedUsdc: string;
  outstandingUsdc: string;
  nextWithdrawalNetUsdc: string;
  nextWithdrawalMaxUsdc: string | null;
}

export interface CopierPricing {
  feeBpsFree: number;
  feeBpsPro: number;
  proPriceUsdc: string;
  proPeriodDays: number;
  freeSlots: number;
  proSlots: number;
}

export interface CopierEntitlement {
  tier: 'free' | 'pro';
  feeBps: number;
  slots: number;
  periodEnd: string | null;
  variant: string;
  billingEnabled: boolean;
  pricing: CopierPricing;
}

export interface CopierPaymentIntent {
  billingId: string;
  chainId: number;
  tokenAddress: string;
  treasuryAddress: string | null;
  amountUsdc: string;
  expiresAt: string | null;
}

export interface CopierBillingRecord {
  id: string;
  status: 'pending' | 'active' | 'expired' | 'void';
  paymentSource: 'copier_wallet' | 'connected_wallet';
  priceUsdc: string;
  periodStart?: string;
  periodEnd?: string;
  txHash?: string | null;
  chainId?: number | null;
  intentExpiresAt?: string | null;
  paymentIntent?: CopierPaymentIntent;
}

// ============================================================================
// In-Memory Copier Demo State
// ============================================================================

const copierDemo = {
  wallet: {
    id: 'copier-wallet-demo-1',
    address: '0x94A8c5d91E3208fA991bC84E1029384756103F1C',
    proxyWallet: '0x5E2B7A19d0F839481726354819203948576189D0',
    origin: 'created' as const,
    signatureType: 'poly_gnosis_safe' as const,
    status: 'active',
    createdAt: '2026-01-20T10:15:00.000Z',
  } satisfies CopierWallet,
  subscriptions: [
    {
      id: 'sub-demo-1',
      traderAddress: '0x7b3291a4c8d1e0f23456789abcdef012345691a4',
      status: 'live' as const,
      strategyConfig: {
        strategy: 'PERCENTAGE' as const,
        copySize: 15,
        maxOrderSizeUsd: 250,
        minOrderSizeUsd: 10,
      },
      createdAt: new Date(Date.now() - 86400 * 1000 * 5).toISOString(),
    },
    {
      id: 'sub-demo-2',
      traderAddress: '0x4c19e08b91a2b3c4d5e6f708192a3b4c5d6ee08b',
      status: 'preview' as const,
      strategyConfig: {
        strategy: 'FIXED' as const,
        copySize: 50,
        maxOrderSizeUsd: 150,
        minOrderSizeUsd: 25,
      },
      createdAt: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
    },
  ] satisfies CopierSubscription[],
  executions: [
    {
      id: 'exec-demo-1',
      status: 'filled',
      market: {
        asset: 'YES',
        slug: 'fed-rate-cut-q4-2026',
        side: 'BUY',
      },
      traderUsdcSize: '1500.00',
      sizing: {
        finalAmount: 225,
        reasoning: '15% proportional copy of whale entry ($1,500 USDC)',
      },
      createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    },
    {
      id: 'exec-demo-2',
      status: 'filled',
      market: {
        asset: 'YES',
        slug: 'btc-above-100k-november',
        side: 'BUY',
      },
      traderUsdcSize: '800.00',
      sizing: {
        finalAmount: 120,
        reasoning: '15% proportional copy of whale entry ($800 USDC)',
      },
      createdAt: new Date(Date.now() - 3600 * 1000 * 9).toISOString(),
    },
    {
      id: 'exec-demo-3',
      status: 'sized',
      market: {
        asset: 'NO',
        slug: 'eth-etf-weekly-outflow',
        side: 'SELL',
      },
      traderUsdcSize: '500.00',
      sizing: {
        finalAmount: 50,
        reasoning: 'Preview mode simulation ($50 fixed order)',
      },
      createdAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    },
  ] satisfies CopierExecution[],
  allowlist: [
    {
      id: 'allow-1',
      address: '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377',
      label: 'Primary BSC / Polygon Wallet',
      effectiveAfter: new Date(Date.now() - 86400 * 1000 * 3).toISOString(),
    },
  ] satisfies AllowlistAddress[],
  withdrawals: [
    {
      id: 'wd-demo-1',
      amountUsdc: '250.00',
      status: 'done' as const,
      address: '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377',
      txHash: '0x3a4b881928019a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a9f12',
      requestedAt: new Date(Date.now() - 86400 * 1000 * 4).toISOString(),
      processedAt: new Date(Date.now() - 86400 * 1000 * 4 + 120_000).toISOString(),
    },
  ] satisfies Withdrawal[],
  balances: {
    address: '0x5E2B7A19d0F839481726354819203948576189D0',
    usdc: '1420.50',
    pol: '18.40',
    allowance: {
      usdcApproved: true,
      checkedAt: new Date().toISOString(),
    },
    openTokens: '345.00',
    updatedAt: new Date().toISOString(),
  } satisfies CopierBalances,
  entitlement: {
    tier: 'free' as 'free' | 'pro',
    feeBps: 150,
    slots: 3,
    periodEnd: null as string | null,
    variant: 'default',
    billingEnabled: true,
    pricing: {
      feeBpsFree: 150,
      feeBpsPro: 50,
      proPriceUsdc: '49.00',
      proPeriodDays: 30,
      freeSlots: 3,
      proSlots: 15,
    },
  } satisfies CopierEntitlement,
};

export function getInitialCopierSnapshot() {
  return {
    wallet: { ...copierDemo.wallet },
    subscriptions: copierDemo.subscriptions.map((s) => ({ ...s })),
    executions: copierDemo.executions.map((e) => ({ ...e })),
    entitlement: { ...copierDemo.entitlement },
    balances: { ...copierDemo.balances },
    allowlist: copierDemo.allowlist.map((a) => ({ ...a })),
    withdrawals: copierDemo.withdrawals.map((w) => ({ ...w })),
  };
}

export async function fetchWallet() {
  return { ok: true, status: 200, data: { ...copierDemo.wallet } };
}

export async function activateWallet(
  body:
    | { origin: 'create' }
    | { origin: 'import_eoa'; privateKey: string }
    | { origin: 'import_safe_owner'; privateKey: string; proxyWallet: string },
) {
  copierDemo.wallet = {
    ...copierDemo.wallet,
    origin: body.origin === 'create' ? 'created' : body.origin === 'import_eoa' ? 'imported_eoa' : 'imported_safe_owner',
    proxyWallet: 'proxyWallet' in body ? body.proxyWallet : copierDemo.wallet.proxyWallet,
    createdAt: new Date().toISOString(),
  };
  return { ok: true, status: 200, data: { ...copierDemo.wallet } };
}

export async function fetchSubscriptions() {
  return { ok: true, status: 200, data: copierDemo.subscriptions.map((s) => ({ ...s })) };
}

export async function createSubscription(body: {
  traderAddress: string;
  strategyConfig: CopierSubscription['strategyConfig'];
}) {
  const created: CopierSubscription = {
    id: `sub-${Date.now()}`,
    traderAddress: body.traderAddress,
    status: 'preview',
    strategyConfig: body.strategyConfig,
    createdAt: new Date().toISOString(),
  };
  copierDemo.subscriptions.unshift(created);
  return { ok: true, status: 201, data: created };
}

export async function updateSubscription(
  id: string,
  body: { status?: CopierSubscription['status'] },
) {
  const sub = copierDemo.subscriptions.find((s) => s.id === id) ?? copierDemo.subscriptions[0]!;
  if (body.status) {
    sub.status = body.status;
  }
  return { ok: true, status: 200, data: { ...sub } };
}

export async function fetchExecutions(limit = 10) {
  return {
    ok: true,
    status: 200,
    data: copierDemo.executions.slice(0, limit).map((e) => ({ ...e })),
  };
}

export async function exportWalletKey() {
  return {
    ok: true,
    status: 200,
    data: {
      privateKey: '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318',
      address: copierDemo.wallet.address,
    } satisfies ExportedKey,
  };
}

export async function fetchAllowlist() {
  return { ok: true, status: 200, data: copierDemo.allowlist.map((a) => ({ ...a })) };
}

export async function addAllowlistAddress(body: { address: string; label?: string }) {
  const item: AllowlistAddress = {
    id: `allow-${Date.now()}`,
    address: body.address,
    label: body.label ?? 'Saved Wallet',
    effectiveAfter: new Date().toISOString(),
  };
  copierDemo.allowlist.push(item);
  return { ok: true, status: 201, data: item };
}

export async function fetchWithdrawals(limit = 10) {
  return {
    ok: true,
    status: 200,
    data: copierDemo.withdrawals.slice(0, limit).map((w) => ({ ...w })),
  };
}

export async function requestWithdrawal(body: { address: string; amountUsdc: number }) {
  const item: Withdrawal = {
    id: `wd-${Date.now()}`,
    amountUsdc: body.amountUsdc.toFixed(2),
    status: 'done',
    address: body.address,
    txHash: '0x88f1c9a0b2d4e6f813579bdf02468ace13579bdf02468ace13579bdf024611a2',
    requestedAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
  };
  copierDemo.withdrawals.unshift(item);
  const currentUsdc = Math.max(0, parseFloat(copierDemo.balances.usdc) - body.amountUsdc);
  copierDemo.balances.usdc = currentUsdc.toFixed(2);
  return { ok: true, status: 201, data: item };
}

export async function verifyCopier2fa(_code: string) {
  return { ok: true, status: 200, data: { fresh: true } };
}

export async function fetchBalances() {
  return { ok: true, status: 200, data: { ...copierDemo.balances } };
}

export async function fetchFees(amountUsdc?: number) {
  const baseUsdc = amountUsdc ?? parseFloat(copierDemo.balances.usdc);
  const outstanding = 5.18;
  const net = Math.max(0, baseUsdc - outstanding).toFixed(2);
  return {
    ok: true as const,
    status: 200,
    data: {
      accruedUsdc: '18.40',
      settledUsdc: '13.22',
      waivedUsdc: '0.00',
      outstandingUsdc: outstanding.toFixed(2),
      nextWithdrawalNetUsdc: net,
      nextWithdrawalMaxUsdc: copierDemo.balances.usdc,
    } satisfies CopierFeeSummary,
  };
}

export async function fetchBilling() {
  return {
    ok: true as const,
    status: 200,
    data: { ...copierDemo.entitlement },
  };
}

export async function subscribePro(body: {
  paymentSource: 'copier_wallet' | 'connected_wallet';
  consent: true;
}) {
  const periodStart = new Date().toISOString();
  const periodEnd = new Date(Date.now() + 86400 * 1000 * 30).toISOString();
  copierDemo.entitlement = {
    ...copierDemo.entitlement,
    tier: 'pro',
    feeBps: 50,
    slots: 15,
    periodEnd,
  };
  return {
    ok: true,
    status: 200,
    data: {
      id: '77777777-7777-4777-8777-777777777701',
      status: 'active',
      paymentSource: body.paymentSource,
      priceUsdc: '49.00',
      periodStart,
      periodEnd,
      txHash: '0x99a1b2c3d4e5f60123456789abcdef0123456789abcdef0123456789abcdef01',
      chainId: 56,
    } satisfies CopierBillingRecord,
  };
}

export async function verifyProPayment(billingId: string, txHash: string) {
  const periodStart = new Date().toISOString();
  const periodEnd = new Date(Date.now() + 86400 * 1000 * 30).toISOString();
  copierDemo.entitlement = {
    ...copierDemo.entitlement,
    tier: 'pro',
    feeBps: 50,
    slots: 15,
    periodEnd,
  };
  return {
    ok: true,
    status: 200,
    data: {
      id: billingId,
      status: 'active',
      paymentSource: 'connected_wallet',
      priceUsdc: '49.00',
      periodStart,
      periodEnd,
      txHash,
      chainId: 56,
    } satisfies CopierBillingRecord,
  };
}

export function beaconCopierViewed(): void {
  // No-op in standalone demo mode
}
