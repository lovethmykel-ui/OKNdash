export type DepositTicker = 'USDT' | 'BTC' | 'ETH' | 'SOL' | 'BNB';

export const PRESALE_TOKEN_PRICE_USD = 0.05;
export const BNB_USD_ESTIMATE = 600;
export const RATE_PER_BNB = Math.round(BNB_USD_ESTIMATE / PRESALE_TOKEN_PRICE_USD); // 12,000 $OKN per BNB

export const REFERENCE_USD_PRICE: Record<DepositTicker, number> = {
  USDT: 1,
  BTC: 94_000,
  ETH: 3_200,
  SOL: 185,
  BNB: 600,
};

export interface PresaleQuote {
  valid: boolean;
  usdAmount: number;
  oknTokens: number;
  cryptoAmount: number;
  cryptoAmountLabel: string;
  bnbEquivalent: number;
}

export function calculatePresaleQuote(
  rawUsdAmount: string | number,
  ticker: DepositTicker,
): PresaleQuote {
  const parsed = typeof rawUsdAmount === 'number' ? rawUsdAmount : Number.parseFloat(rawUsdAmount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return {
      valid: false,
      usdAmount: 0,
      oknTokens: 0,
      cryptoAmount: 0,
      cryptoAmountLabel: `0 ${ticker}`,
      bnbEquivalent: 0,
    };
  }

  const oknTokens = Math.round(parsed / PRESALE_TOKEN_PRICE_USD);
  const priceUsd = REFERENCE_USD_PRICE[ticker] ?? 1;
  const cryptoAmount = parsed / priceUsd;
  const decimals = ticker === 'USDT' ? 2 : ticker === 'BTC' ? 6 : ticker === 'ETH' ? 5 : 4;
  const cryptoAmountLabel = `${cryptoAmount.toFixed(decimals)} ${ticker}`;
  const bnbEquivalent = Math.max(0.01, parsed / BNB_USD_ESTIMATE);

  return {
    valid: true,
    usdAmount: parsed,
    oknTokens,
    cryptoAmount,
    cryptoAmountLabel,
    bnbEquivalent,
  };
}
