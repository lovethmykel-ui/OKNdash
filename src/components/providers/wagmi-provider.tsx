'use client';

/**
 * components/providers/wagmi-provider.tsx — Demo-ready Wagmi & React Query provider.
 *
 * Uses standard wagmi createConfig + HTTP transport for BSC Mainnet / Testnet so
 * the application renders immediately without waiting on heavy external AppKit
 * WebComponent chunks or WalletConnect relay connections.
 */

import { type ReactNode, useEffect, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

const wagmiConfig = createConfig({
  chains: [bsc, bscTestnet],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
  ssr: true,
});

function createPrewarmedQueryClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: false,
      },
    },
  });

  // Pre-warm core dashboard queries so every page renders on Frame 1 with zero skeleton flash
  void client.prefetchQuery({ queryKey: ['me'], queryFn: api.getMe });
  void client.prefetchQuery({ queryKey: ['portfolio'], queryFn: api.getPortfolio });
  void client.prefetchQuery({ queryKey: ['tasks'], queryFn: api.getTasks });
  void client.prefetchQuery({ queryKey: ['claim-eligibility'], queryFn: api.getClaimEligibility });
  void client.prefetchQuery({ queryKey: ['rewards', 'streak'], queryFn: api.getStreak });
  void client.prefetchQuery({ queryKey: ['sale-price'], queryFn: api.getSalePrice });
  void client.prefetchQuery({ queryKey: ['purchase-history'], queryFn: () => api.getPurchaseHistory(1, 20) });
  void client.prefetchQuery({ queryKey: ['referral'], queryFn: api.getReferralInfo });
  void client.prefetchQuery({ queryKey: ['missions'], queryFn: api.getMissions });

  return client;
}

interface Props {
  children: ReactNode;
  cookies?: string | null;
}

export function WagmiProviders({ children }: Props) {
  const [queryClient] = useState(createPrewarmedQueryClient);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {mounted ? (
          children
        ) : (
          <div
            suppressHydrationWarning
            style={{ minHeight: '100vh', background: 'var(--bg0, #09080f)' }}
          />
        )}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
