'use client';

/**
 * components/dashboard/wallet-connect.tsx — Demo-ready wallet status & switcher.
 */

import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { useMe } from '@/lib/hooks/use-me';
import { api, getDemoWalletAddress } from '@/lib/api/client';

export function WalletConnect() {
  const t = useTranslations('dashboard.walletConnect');
  const { address } = useAccount();
  const qc = useQueryClient();
  const { toast } = useToast();
  const me = useMe();
  const [switching, setSwitching] = useState(false);

  const activeAddress =
    address ?? me.data?.user?.walletAddress ?? getDemoWalletAddress();

  const handleSwitchDemoWallet = async () => {
    setSwitching(true);
    try {
      const res = await api.cycleDemoWallet();
      await qc.invalidateQueries({ queryKey: ['me'] });
      toast({
        title: 'Demo Wallet Switched',
        description: `Active demo wallet is now ${res.walletAddress.slice(0, 6)}...${res.walletAddress.slice(-4)}`,
      });
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-xs font-bold text-emerald-400">
        <span className="size-2 rounded-full bg-emerald-400" />
        {t('walletLabel', {
          addr: `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`,
        })}
      </span>
      <button
        type="button"
        onClick={() => void handleSwitchDemoWallet()}
        disabled={switching}
        className="rounded-xl bg-[#7A12F5] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#8C38F7] cursor-pointer"
      >
        {switching ? 'Switching...' : 'Switch Demo Wallet'}
      </button>
    </div>
  );
}
