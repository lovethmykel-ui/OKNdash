import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVITY_TRANSACTIONS,
  filterActivityTransactions,
  shortenTxHash,
  summarizeTransactions,
} from './activity-transactions';

test('filterActivityTransactions returns all items for All filter', () => {
  const result = filterActivityTransactions(ACTIVITY_TRANSACTIONS, 'All');
  assert.equal(result.length, ACTIVITY_TRANSACTIONS.length);
});

test('filterActivityTransactions filters strictly by asset', () => {
  const oknOnly = filterActivityTransactions(ACTIVITY_TRANSACTIONS, '$OKN');
  assert.ok(oknOnly.length > 0);
  assert.ok(oknOnly.every((tx) => tx.asset === '$OKN'));

  const bnbOnly = filterActivityTransactions(ACTIVITY_TRANSACTIONS, 'BNB');
  assert.ok(bnbOnly.length > 0);
  assert.ok(bnbOnly.every((tx) => tx.asset === 'BNB'));

  const ptsOnly = filterActivityTransactions(ACTIVITY_TRANSACTIONS, 'OK Points');
  assert.ok(ptsOnly.length > 0);
  assert.ok(ptsOnly.every((tx) => tx.asset === 'OK Points'));
});

test('filterActivityTransactions matches query across title, subtitle, and hash', () => {
  const presale = filterActivityTransactions(ACTIVITY_TRANSACTIONS, 'All', 'presale');
  assert.equal(presale.length, 1);
  assert.equal(presale[0].id, 'tx-presale-1');

  const byHash = filterActivityTransactions(ACTIVITY_TRANSACTIONS, 'All', '0x8f4e');
  assert.equal(byHash.length, 1);
  assert.equal(byHash[0].id, 'tx-presale-1');

  const none = filterActivityTransactions(ACTIVITY_TRANSACTIONS, 'All', 'nonexistent-query-xyz');
  assert.equal(none.length, 0);
});

test('summarizeTransactions computes accurate totals and on-chain counts', () => {
  const summary = summarizeTransactions(ACTIVITY_TRANSACTIONS);
  assert.equal(summary.total, ACTIVITY_TRANSACTIONS.length);
  assert.ok(summary.confirmed > 0);
  assert.ok(summary.awaitingCommit > 0);
  assert.ok(summary.onChainCount > 0);
});

test('shortenTxHash truncates long hashes cleanly', () => {
  assert.equal(shortenTxHash('0x8f4e91c2b7a0d413e9c820fa39a1b61d22f0c3a4'), '0x8f4e…c3a4');
  assert.equal(shortenTxHash('0x1234'), '0x1234');
});
