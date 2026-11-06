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
import { AlertCircle, CheckCircle2, Gift, Loader2 } from 'lucide-react';
import { explorerTxUrl } from '@okn/shared';
import { useClaimEligibility, useClaimProof } from '@/lib/hooks/use-claim';
import { useMe } from '@/lib/hooks/use-me';
import { useOknBalance, useRequiredFeeBnb } from '@/lib/hooks/use-wallet';
import { api } from '@/lib/api/client';
import { triggerConfetti } from '@/lib/confetti';
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
    setErr(null);
    setConfirming(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      const { txHash } = await api.recordDemoClaim(entitlement);
      setClaimedTxHash(txHash);
      triggerConfetti();

      toast({
        title: tToast('submittedTitle'),
        description: (
          <span className="flex flex-col gap-1">
            <span>
              Claimed {formatWei(entitlement)} $OKN to {shortAddress(effectiveAddress)} (Demo Mode).
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

      void qc.invalidateQueries({ queryKey: ['demo-okn-balance'] });
      void qc.invalidateQueries({ queryKey: ['claim-eligibility'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['portfolio'] });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      void balance.refetch();
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
          <span className="text-muted-foreground">Receiving Demo Wallet</span>
          <span className="font-mono font-semibold text-foreground">
            {shortAddress(effectiveAddress)}
          </span>
        </div>

        <Button
          onClick={() => void onClaim()}
          disabled={confirming}
          className="w-full cursor-pointer bg-[#7A12F5] text-white hover:bg-[#8C38F7]"
        >
          {confirming ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Gift data-icon="inline-start" />
          )}
          {confirming ? t('btnConfirming') : `${t('btnIdle')} (${formatWei(entitlement)} $OKN)`}
        </Button>

        {claimedTxHash && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-[#2FBD8E]/30 bg-[#2FBD8E]/10 px-3 py-2 text-xs text-[#2FBD8E]">
            <span className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="size-4 shrink-0" />
              Claimed {formatWei(entitlement)} $OKN to your balance!
            </span>
            <span className="font-mono text-[11px] opacity-80">
              {claimedTxHash.slice(0, 8)}...{claimedTxHash.slice(-6)}
            </span>
          </div>
        )}

        {feeNote ? (
          <p className="text-xs text-muted-foreground tabular-nums">{feeNote}</p>
        ) : null}

        {err ? (
          <p className="flex items-start gap-1.5 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {err}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
