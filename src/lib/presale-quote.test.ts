import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePresaleQuote } from './presale-quote';

describe('calculatePresaleQuote', () => {
  it('computes exact $OKN allocation from USD deposit amount', () => {
    const quote = calculatePresaleQuote('600', 'USDT');
    assert.equal(quote.valid, true);
    assert.equal(quote.usdAmount, 600);
    assert.equal(quote.oknTokens, 1_000_000);
    assert.equal(quote.cryptoAmountLabel, '600.00 USDT');
  });

  it('scales BTC and BNB deposit approximations accurately', () => {
    const bnbQuote = calculatePresaleQuote(300, 'BNB');
    assert.equal(bnbQuote.valid, true);
    assert.equal(bnbQuote.oknTokens, 500_000);
    assert.equal(bnbQuote.cryptoAmountLabel, '0.5000 BNB');

    const btcQuote = calculatePresaleQuote('250', 'BTC');
    assert.equal(btcQuote.valid, true);
    assert.ok(btcQuote.cryptoAmount > 0 && btcQuote.cryptoAmount < 0.01);
    assert.ok(btcQuote.cryptoAmountLabel.endsWith(' BTC'));
  });

  it('rejects non-positive and invalid inputs safely', () => {
    assert.equal(calculatePresaleQuote('', 'USDT').valid, false);
    assert.equal(calculatePresaleQuote('0', 'ETH').valid, false);
    assert.equal(calculatePresaleQuote(-100, 'SOL').oknTokens, 0);
  });
});
