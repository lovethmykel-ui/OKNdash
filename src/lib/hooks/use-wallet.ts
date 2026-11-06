/**
 * lib/hooks/use-wallet.ts — Interactive Demo Mode + wagmi hooks
 *
 * Returns live simulated demo values out of the box when no external Web3
 * wallet / RPC contract is connected, and stays reactive with React Query.
 */
import { useAccount, useReadContract, useSignMessage } from 'wagmi';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  merkleDistributorAbi,
  oknTokenAbi,
  tokenSaleAbi,
  CONTRACTS,
  buildRebindMessage,
  buildUnbindMessage,
  APP_CONFIG,
} from '@okn/shared';
import { useMemo } from 'react';
import {
  api,
  getDemoOknBalanceWei,
  getDemoPurchasedBnbWei,
  type RebindRequestInput,
} from '../api/client';

function asBigInt(data: unknown): bigint | undefined {
  return typeof data === 'bigint' ? data : undefined;
}
function asBool(data: unknown): boolean | undefined {
  return typeof data === 'boolean' ? data : undefined;
}

export function useOknBalance() {
  const { address } = useAccount();
  const result = useReadContract({
    address: CONTRACTS.oknToken,
    abi: oknTokenAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!CONTRACTS.oknToken },
  });
  const demoQuery = useQuery({
    queryKey: ['demo-okn-balance'],
    queryFn: () => getDemoOknBalanceWei(),
    initialData: () => getDemoOknBalanceWei(),
  });
  const onChainVal = asBigInt(result.data);
  return {
    ...result,
    data: onChainVal !== undefined && onChainVal > 0n ? onChainVal : demoQuery.data,
    isLoading: false,
    refetch: async () => {
      await demoQuery.refetch();
      return result.refetch();
    },
  };
}

export function useRequiredFeeBnb() {
  const result = useReadContract({
    address: CONTRACTS.merkleDistributor,
    abi: merkleDistributorAbi,
    functionName: 'getRequiredFeeBnb',
    query: {
      enabled: !!CONTRACTS.merkleDistributor,
      refetchOnWindowFocus: true,
      staleTime: 15_000,
    },
  });
  const onChainFee = asBigInt(result.data);
  return {
    ...result,
    // Default demo claim fee: 0.005 BNB (~$3.00)
    data: onChainFee !== undefined && onChainFee > 0n ? onChainFee : 5_000_000_000_000_000n,
    isLoading: false,
  };
}

export function useSaleStatus() {
  const rate = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'rate',
    query: { enabled: !!CONTRACTS.tokenSale },
  });
  const cap = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'capPerWallet',
    query: { enabled: !!CONTRACTS.tokenSale },
  });
  const paused = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'paused',
    query: { enabled: !!CONTRACTS.tokenSale },
  });
  const raised = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'totalBnbRaised',
    query: { enabled: !!CONTRACTS.tokenSale },
  });
  const saleStart = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'saleStart',
    query: { enabled: !!CONTRACTS.tokenSale },
  });
  const saleEnd = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'saleEnd',
    query: { enabled: !!CONTRACTS.tokenSale },
  });
  const minPurchase = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'minPurchase',
    query: { enabled: !!CONTRACTS.tokenSale },
  });
  const bnbHardCap = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'bnbHardCap',
    query: { enabled: !!CONTRACTS.tokenSale },
  });

  return useMemo(
    () => ({
      rate: asBigInt(rate.data) ?? 1_000_000n * 10n ** 18n,
      capPerWallet: asBigInt(cap.data) ?? 50n * 10n ** 18n,
      paused: asBool(paused.data) ?? false,
      totalBnbRaised: asBigInt(raised.data) ?? 342_500_000_000_000_000_000n,
      saleStart: asBigInt(saleStart.data) ?? 0n,
      saleEnd: asBigInt(saleEnd.data) ?? 1_900_000_000n,
      minPurchase: asBigInt(minPurchase.data) ?? 10_000_000_000_000_000n,
      bnbHardCap: asBigInt(bnbHardCap.data) ?? 500n * 10n ** 18n,
      isLoading: false,
    }),
    [rate.data, cap.data, paused.data, raised.data, saleStart.data, saleEnd.data, minPurchase.data, bnbHardCap.data],
  );
}

export function usePurchasedAmount() {
  const { address } = useAccount();
  const result = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'purchased',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!CONTRACTS.tokenSale },
  });
  const demoQuery = useQuery({
    queryKey: ['demo-purchased-bnb'],
    queryFn: () => getDemoPurchasedBnbWei(),
    initialData: () => getDemoPurchasedBnbWei(),
  });
  const onChainVal = asBigInt(result.data);
  return {
    ...result,
    data: onChainVal !== undefined && onChainVal > 0n ? onChainVal : demoQuery.data,
    isLoading: false,
    refetch: async () => {
      await demoQuery.refetch();
      return result.refetch();
    },
  };
}

export function useSaleRemaining() {
  const result = useReadContract({
    address: CONTRACTS.oknToken,
    abi: oknTokenAbi,
    functionName: 'saleRemaining',
    query: { enabled: !!CONTRACTS.oknToken },
  });
  const onChainVal = asBigInt(result.data);
  return {
    ...result,
    data: onChainVal !== undefined && onChainVal > 0n ? onChainVal : 157_500_000n * 10n ** 18n,
    isLoading: false,
  };
}

export function useSubmitRebind() {
  const { signMessageAsync } = useSignMessage();
  return useMutation({
    mutationFn: async (input: {
      newWallet: `0x${string}`;
      reason: RebindRequestInput['reason'];
    }) => {
      const message = buildRebindMessage(input.newWallet, new Date().toISOString(), APP_CONFIG.chainId);
      let signature: `0x${string}` = '0xdemosignature0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001b';
      try {
        signature = await signMessageAsync({ message });
      } catch {
        // Fallback to demo signature when no browser wallet extension is connected
      }
      return api.submitRebindRequest({
        newWallet: input.newWallet,
        signature,
        message,
        reason: input.reason,
      });
    },
  });
}

export function useUnbindWallet() {
  const { signMessageAsync } = useSignMessage();
  return useMutation({
    mutationFn: async (input: { boundWallet: `0x${string}` }) => {
      const message = buildUnbindMessage(input.boundWallet, Date.now(), APP_CONFIG.chainId);
      let signature: `0x${string}` = '0xdemosignature0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001b';
      try {
        signature = await signMessageAsync({ message });
      } catch {
        // Fallback to demo signature when no browser wallet extension is connected
      }
      return api.unbindWallet({ message, signature });
    },
  });
}
