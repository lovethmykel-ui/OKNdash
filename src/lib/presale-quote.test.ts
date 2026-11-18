import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESALE_TOKEN_PRICE_USD,
  RATE_PER_BNB,
  calculatePresaleQuote,
} from './presale-quote';

describe('calculatePresaleQuote', () => {
  it('starts presale at $0.05 per $OKN (12,000 $OKN per 1 BNB)', () => {
    assert.equal(PRESALE_TOKEN_PRICE_USD, 0.05);
    assert.equal(RATE_PER_BNB, 12_000);
  });

  it('computes exact $OKN allocation from USD deposit amount at $0.05', () => {
    const quote = calculatePresaleQuote('600', 'USDT');
    assert.equal(quote.valid, true);
    assert.equal(quote.usdAmount, 600);
    assert.equal(quote.oknTokens, 12_000);
    assert.equal(quote.cryptoAmountLabel, '600.00 USDT');

    const standardQuote = calculatePresaleQuote('250', 'USDT');
    assert.equal(standardQuote.valid, true);
    assert.equal(standardQuote.oknTokens, 5_000);
  });

  it('scales BTC and BNB deposit approximations accurately at $0.05', () => {
    const bnbQuote = calculatePresaleQuote(300, 'BNB');
    assert.equal(bnbQuote.valid, true);
    assert.equal(bnbQuote.oknTokens, 6_000);
    assert.equal(bnbQuote.cryptoAmountLabel, '0.5000 BNB');

    const btcQuote = calculatePresaleQuote('250', 'BTC');
    assert.equal(btcQuote.valid, true);
    assert.equal(btcQuote.oknTokens, 5_000);
    assert.ok(btcQuote.cryptoAmount > 0 && btcQuote.cryptoAmount < 0.01);
    assert.ok(btcQuote.cryptoAmountLabel.endsWith(' BTC'));
  });

  it('rejects non-positive and invalid inputs safely', () => {
    assert.equal(calculatePresaleQuote('', 'USDT').valid, false);
    assert.equal(calculatePresaleQuote('0', 'ETH').valid, false);
    assert.equal(calculatePresaleQuote(-100, 'SOL').oknTokens, 0);
  });
});
