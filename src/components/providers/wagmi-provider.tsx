'use client';

/**
 * components/providers/wagmi-provider.tsx — Demo-ready Wagmi & React Query provider.
 *
 * Uses standard wagmi createConfig + HTTP transport for BSC Mainnet / Testnet so
 * the application renders immediately without waiting on heavy external AppKit
 * WebComponent chunks or WalletConnect relay connections.
 */

import { type ReactNode, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const wagmiConfig = createConfig({
  chains: [bsc, bscTestnet],
  transports: {
    [bsc.id]: http('https://bsc-rpc.publicnode.com'),
    [bscTestnet.id]: http('https://bsc-testnet-rpc.publicnode.com'),
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

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
