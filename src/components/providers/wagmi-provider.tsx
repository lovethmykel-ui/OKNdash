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

function createQueryClient(): QueryClient {
  return new QueryClient({
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
}

interface Props {
  children: ReactNode;
  cookies?: string | null;
}

export function WagmiProviders({ children }: Props) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    void queryClient.prefetchQuery({ queryKey: ['me'], queryFn: api.getMe });
    void queryClient.prefetchQuery({ queryKey: ['portfolio'], queryFn: api.getPortfolio });
    void queryClient.prefetchQuery({ queryKey: ['tasks'], queryFn: api.getTasks });
    void queryClient.prefetchQuery({ queryKey: ['claim-eligibility'], queryFn: api.getClaimEligibility });
    void queryClient.prefetchQuery({ queryKey: ['rewards', 'streak'], queryFn: api.getStreak });
    void queryClient.prefetchQuery({ queryKey: ['sale-price'], queryFn: api.getSalePrice });
    void queryClient.prefetchQuery({ queryKey: ['purchase-history'], queryFn: () => api.getPurchaseHistory(1, 20) });
    void queryClient.prefetchQuery({ queryKey: ['referral'], queryFn: api.getReferralInfo });
    void queryClient.prefetchQuery({ queryKey: ['missions'], queryFn: api.getMissions });
  }, [queryClient]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
