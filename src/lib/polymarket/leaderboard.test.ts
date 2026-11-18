import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  POLYMARKET_LEADERBOARD_TRADERS,
  canEngageLiveCopy,
  filterAndSortLeaderboard,
  formatCompactUsd,
  shortenEvmAddress,
} from './leaderboard';

describe('Polymarket Leaderboard helpers', () => {
  it('ranks traders by selected metric and timeframe', () => {
    const byPnl = filterAndSortLeaderboard(POLYMARKET_LEADERBOARD_TRADERS, {
      timeframe: 'month',
      category: 'All',
      sortBy: 'pnl',
      search: '',
    });
    assert.equal(byPnl.length, POLYMARKET_LEADERBOARD_TRADERS.length);
    assert.equal(byPnl[0]?.rank, 1);
    assert.ok(byPnl[0]!.periodStats.pnlUsd >= byPnl[1]!.periodStats.pnlUsd);

    const byWinRate = filterAndSortLeaderboard(POLYMARKET_LEADERBOARD_TRADERS, {
      timeframe: 'day',
      category: 'All',
      sortBy: 'winRate',
      search: '',
    });
    assert.ok(byWinRate[0]!.periodStats.winRate >= byWinRate[1]!.periodStats.winRate);
  });

  it('filters by category and search handle/address', () => {
    const cryptoOnly = filterAndSortLeaderboard(POLYMARKET_LEADERBOARD_TRADERS, {
      timeframe: 'week',
      category: 'Crypto',
      sortBy: 'volume',
      search: '',
    });
    assert.ok(cryptoOnly.length >= 2);
    assert.ok(cryptoOnly.every((e) => e.trader.specialty === 'Crypto'));

    const searchByHandle = filterAndSortLeaderboard(POLYMARKET_LEADERBOARD_TRADERS, {
      timeframe: 'all',
      category: 'All',
      sortBy: 'pnl',
      search: 'theo4',
    });
    assert.equal(searchByHandle.length, 1);
    assert.equal(searchByHandle[0]?.trader.handle, '@Theo4');
  });

  it('formats compact USD and short EVM addresses cleanly', () => {
    assert.equal(formatCompactUsd(2_140_500, true), '+$2.14M');
    assert.equal(formatCompactUsd(142_800, true), '+$142.8K');
    assert.equal(formatCompactUsd(450, false), '$450');
    assert.equal(
      shortenEvmAddress('0x7b3291a4c8d1e0f23456789abcdef012345691a4'),
      '0x7b32...91a4',
    );
  });

  it('validates whether Agent wallet is funded before live copy trading', () => {
    assert.deepEqual(canEngageLiveCopy(0, 1.5), {
      ready: false,
      needsUsdc: true,
      needsGas: false,
    });
    assert.deepEqual(canEngageLiveCopy(250, 0), {
      ready: false,
      needsUsdc: false,
      needsGas: true,
    });
    assert.deepEqual(canEngageLiveCopy(250, 2.0), {
      ready: true,
      needsUsdc: false,
      needsGas: false,
    });
  });
});
