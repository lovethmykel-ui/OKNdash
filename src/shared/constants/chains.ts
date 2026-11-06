import { defineChain } from 'viem';
import { bsc, bscTestnet } from 'viem/chains';

// Re-export viem chain definitions so apps can import from one place.
export { bsc, bscTestnet };

// Canonical chain config (Interactive Demo — zero external env vars required)
export const BSC_MAINNET = {
  chainId: 56,
  chain: bsc,
  rpcUrl: 'https://bsc-dataseed.binance.org',
  explorerUrl: 'https://bscscan.com',
  label: 'BSC Mainnet',
} as const;

export const BSC_TESTNET = {
  chainId: 97,
  chain: bscTestnet,
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  explorerUrl: 'https://testnet.bscscan.com',
  label: 'BSC Testnet',
} as const;

export const SUPPORTED_CHAINS = [BSC_MAINNET, BSC_TESTNET] as const;

// === CANONICAL DEPLOYED ADDRESSES ===
export const CANONICAL_CONTRACTS_MAINNET = {
  oknToken: '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377',
  merkleDistributor: '0xC0e7a1cEB339B7a35Af81D2AE7705f7d8456C4a9',
  tokenSale: '0x46fC09a84C23c94Ea6853450253C050be44dB751',
  teamVesting: '0x0ce655e5965a1661629A975b79f7E7f252ed3F74',
} as const;

export const CANONICAL_CONTRACTS_TESTNET = {
  oknToken: '0xfaA8911dFD487452B7a05f1cDBEFdC4456115a83',
  merkleDistributor: '0xC5638E652321C429f81438c29bC220280F131409',
  tokenSale: '0x6c3bDE2a0d07E288B72580D3717B0B807ffcb73c',
  teamVesting: '0x70059a91cAc5d4C975813020da39112f8ef5e1b8',
} as const;

export function isTestnetMode(): boolean {
  return false;
}

export function getActiveContracts() {
  return CANONICAL_CONTRACTS_MAINNET;
}

export const CONTRACTS = {
  oknToken: CANONICAL_CONTRACTS_MAINNET.oknToken as `0x${string}`,
  merkleDistributor: CANONICAL_CONTRACTS_MAINNET.merkleDistributor as `0x${string}`,
  tokenSale: CANONICAL_CONTRACTS_MAINNET.tokenSale as `0x${string}`,
  teamVesting: CANONICAL_CONTRACTS_MAINNET.teamVesting as `0x${string}`,
} as const;

export const CHAINLINK_FEEDS = {
  bnbUsdMainnet: '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',
  bnbUsdTestnet: '0x2514895C72f50d8Bd4b4f9B1110F45d1d145c4C3',
} as const;

export function getChainlinkFeed(chainId: number): `0x${string}` {
  if (chainId !== 56 && chainId !== 97) {
    throw new Error(
      `No Chainlink BNB/USD feed configured for chainId ${chainId} (expected 56 or 97)`,
    );
  }
  return (chainId === 56
    ? CHAINLINK_FEEDS.bnbUsdMainnet
    : CHAINLINK_FEEDS.bnbUsdTestnet) as `0x${string}`;
}

export const APP_CONFIG = {
  chainId: 56,
  explorerUrl: 'https://bscscan.com',
  appUrl: 'https://app.okntoken.com',
  botUsername: 'okntest001_bot',
  telegramLoginDomain: '',
  walletConnectProjectId: 'b56e18d47c72ab683b10814fe9495694',
} as const;

export function getConfiguredChainId(): number {
  return 56;
}

export const TOKEN_CONSTANTS = {
  name: 'OKN Token',
  symbol: '$OKN',
  decimals: 18,
  maxSupply: 5_000_000_000n * 10n ** 18n, // 5 billion
  communityCap: 1_750_000_000n * 10n ** 18n, // 35%
  publicSaleCap: 1_250_000_000n * 10n ** 18n, // 25%
  initialMint: 2_000_000_000n * 10n ** 18n, // 40%
} as const;

export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

export function getChain(chainId: number): SupportedChain | undefined {
  return SUPPORTED_CHAINS.find((c) => c.chainId === chainId);
}

export function explorerTxUrl(txHash: string, explorerUrl = APP_CONFIG.explorerUrl): string {
  return `${explorerUrl}/tx/${txHash}`;
}

export function explorerAddressUrl(address: string, explorerUrl = APP_CONFIG.explorerUrl): string {
  return `${explorerUrl}/address/${address}`;
}

export function wagmiChain(chainId: number) {
  return defineChain({
    ...(getChain(chainId)?.chain ?? bsc),
  });
}

export const BSC_USDC_ADDRESS = '0x8AC76a51cc950d9822D68b83fe1Ad97B32Cd580d' as `0x${string}`;
