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

const wagmiConfig = createConfig({
  chains: [bsc, bscTestnet],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
  ssr: true,
});

interface Props {
  children: ReactNode;
  cookies?: string | null;
}

export function WagmiProviders({ children }: Props) {
  const [queryClient] = useState(() => new QueryClient());
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
