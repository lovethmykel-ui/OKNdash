'use client';

/**
 * dashboard/claim-button.tsx — Interactive Demo Claim Flow Card.
 *
 * Works out-of-the-box in Demo Mode with the pre-connected demo wallet
 * (or a real wagmi wallet if connected), simulating on-chain confirmation,
 * celebrating with confetti, and crediting claimed $OKN to the demo balance.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { formatEther } from 'viem';
import { AlertCircle, Gift, Loader2, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { explorerTxUrl } from '@okn/shared';
import { useClaimEligibility, useClaimProof } from '@/lib/hooks/use-claim';
import { useMe } from '@/lib/hooks/use-me';
import { useOknBalance, useRequiredFeeBnb } from '@/lib/hooks/use-wallet';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { formatWei, shortAddress } from '@/lib/utils';

export function ClaimButton() {
  const t = useTranslations('dashboard.claimButton');
  const tToast = useTranslations('toasts.claim');
  const { address } = useAccount();
  const me = useMe();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: eligibility } = useClaimEligibility();
  const balance = useOknBalance();
  const feeQuery = useRequiredFeeBnb();

  const [err, setErr] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [claimedTxHash, setClaimedTxHash] = useState<string | null>(null);

  const effectiveAddress =
    address ??
    (me.data?.user?.walletAddress as `0x${string}` | undefined) ??
    '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377';

  const latestRootVersion = eligibility?.latestRootVersion ?? 3;
  const proofQuery = useClaimProof(latestRootVersion);
  const proof = proofQuery.data ?? null;

  let entitlement = 250_000n * 10n ** 18n;
  try {
    if (proof?.cumulativeEntitlement) {
      entitlement = BigInt(proof.cumulativeEntitlement);
    }
  } catch {
    entitlement = 250_000n * 10n ** 18n;
  }

  const onClaim = async () => {
    if (confirming || claimedTxHash) return;
    setErr(null);
    setConfirming(true);
    try {
      await new Promise((r) => setTimeout(r, 550));
      const { txHash } = await api.recordDemoClaim(entitlement);
      setClaimedTxHash(txHash);

      toast({
        title: tToast('submittedTitle'),
        description: (
          <span className="flex flex-col gap-1">
            <span>
              Claimed {formatWei(entitlement)} $OKN to {shortAddress(effectiveAddress)}.
            </span>
            <a
              href={explorerTxUrl(txHash)}
              target="_blank"
              rel="noreferrer"
              className="text-ios-blue underline"
            >
              {tToast('submittedDescLink')}
            </a>
          </span>
        ),
      });

      await Promise.all([
        qc.invalidateQueries({ queryKey: ['demo-okn-balance'] }),
        qc.invalidateQueries({ queryKey: ['claim-eligibility'] }),
        qc.invalidateQueries({ queryKey: ['me'] }),
        qc.invalidateQueries({ queryKey: ['portfolio'] }),
        qc.invalidateQueries({ queryKey: ['notifications'] }),
        balance.refetch(),
      ]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('errFailed'));
    } finally {
      setConfirming(false);
    }
  };

  const feeNote =
    feeQuery.data !== undefined
      ? t('feeNote', {
          value: Number(formatEther(feeQuery.data)).toFixed(6).replace(/\.?0+$/, ''),
        })
      : null;

  const isDone = Boolean(claimedTxHash);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {proofQuery.isLoading
            ? t('descLoading')
            : t('descClaimable', { value: formatWei(entitlement) })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {proofQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : null}

        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5 text-xs">
          <span className="text-muted-foreground">Receiving Wallet</span>
          <span className="font-mono font-semibold text-foreground">
            {shortAddress(effectiveAddress)}
          </span>
        </div>

        <Button
          onClick={() => void onClaim()}
          disabled={confirming || isDone}
          className={`w-full h-11 rounded-xl font-extrabold transition-all ${
            isDone
              ? 'bg-[#2FBD8E]/15 text-[#2FBD8E] border border-[#2FBD8E]/35 hover:bg-[#2FBD8E]/20 cursor-default shadow-[0_0_20px_rgba(47,189,142,0.2)]'
              : 'cursor-pointer bg-[#7A12F5] text-white hover:bg-[#8C38F7]'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDone ? (
              <motion.span
                key="done"
                initial={{ opacity: 0, scale: 0.72, y: 6, filter: 'blur(6px)' }}
                animate={{ opacity: 1, scale: [0.85, 1.06, 1], y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 text-[#2FBD8E]"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-[#2FBD8E] text-white shadow-[0_0_12px_rgba(47,189,142,0.6)]">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M5 13l4 4L19 7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.34, delay: 0.06, ease: 'easeOut' }}
                    />
                  </svg>
                </span>
                <span>Done · Claimed {formatWei(entitlement)} $OKN</span>
              </motion.span>
            ) : confirming ? (
              <motion.span
                key="confirming"
                initial={{ opacity: 0, y: 5, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -5, filter: 'blur(4px)' }}
                transition={{ duration: 0.18 }}
                className="inline-flex items-center gap-2"
              >
                <Loader2 className="size-4 animate-spin" />
                <span>{t('btnConfirming')}</span>
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
                className="inline-flex items-center gap-2"
              >
                <Gift className="size-4" />
                <span>{`${t('btnIdle')} (${formatWei(entitlement)} $OKN)`}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        {claimedTxHash && (
          <motion.div
            initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-between gap-2 rounded-xl border border-[#2FBD8E]/30 bg-[#2FBD8E]/10 px-3.5 py-2.5 text-xs text-[#2FBD8E]"
          >
            <span className="font-bold">
              Credited +{formatWei(entitlement)} $OKN to your balance
            </span>
            <span className="font-mono text-[11px] opacity-85">
              {claimedTxHash.slice(0, 8)}...{claimedTxHash.slice(-6)}
            </span>
          </motion.div>
        )}

        {feeNote ? (
          <p className="text-xs text-muted-foreground tabular-nums">{feeNote}</p>
        ) : null}

        {err ? (
          <div
            role="alert"
            className="flex items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="size-3.5 shrink-0" />
              {err}
            </span>
            <button
              type="button"
              onClick={() => void onClaim()}
              className="inline-flex items-center gap-1 rounded-lg bg-destructive px-2.5 py-1 text-[11px] font-bold text-white hover:opacity-90 cursor-pointer"
            >
              <RefreshCw className="size-3" />
              Retry
            </button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
