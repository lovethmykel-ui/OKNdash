import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  POLYMARKET_LEADERBOARD_TRADERS,
  buildPolymarketProfileUrl,
  canEngageLiveCopy,
  fallbackToLiveEntries,
  filterAndSortLeaderboard,
  filterLiveLeaderboardTraders,
  formatCompactUsd,
  formatPolymarketUsername,
  formatRelativeTime,
  normalizePolymarketV2Row,
  normalizePolymarketV2Rows,
  normalizeTraderPosition,
  normalizeTraderTrade,
  shortenEvmAddress,
  toPolymarketCategory,
  toPolymarketSortBy,
  toPolymarketTimePeriod,
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
    assert.equal(formatCompactUsd(-42_500, true), '-$42.5K');
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

  it('maps UI filters to Polymarket Data API v2 query params', () => {
    assert.equal(toPolymarketTimePeriod('day'), 'DAY');
    assert.equal(toPolymarketTimePeriod('week'), 'WEEK');
    assert.equal(toPolymarketTimePeriod('month'), 'MONTH');
    assert.equal(toPolymarketTimePeriod('all'), 'ALL');

    assert.equal(toPolymarketCategory('All'), 'OVERALL');
    assert.equal(toPolymarketCategory('Politics'), 'POLITICS');
    assert.equal(toPolymarketCategory('Finance'), 'FINANCE');
    assert.equal(toPolymarketSortBy('pnl'), 'PNL');
    assert.equal(toPolymarketSortBy('volume'), 'VOLUME');
  });

  it('collapses anonymous 0x-timestamp Polymarket handles and keeps custom usernames', () => {
    const anon = formatPolymarketUsername(
      '0x2c335066FE58fe9237c3d3Dc7b275C2a034a0563-1759935795465',
      '0x2c335066fe58fe9237c3d3dc7b275c2a034a0563',
    );
    assert.deepEqual(anon, { displayName: '0x2c33...0563', isAnonAddress: true });

    const named = formatPolymarketUsername('balthazar', '0x1111111111111111111111111111111111111111');
    assert.deepEqual(named, { displayName: 'balthazar', isAnonAddress: false });
  });

  it('normalizes Data API v2 leaderboard rows and filters search queries', () => {
    const rows = normalizePolymarketV2Rows([
      {
        rank: 1,
        user_id: '0x2c335066fe58fe9237c3d3dc7b275c2a034a0563',
        pnl: 3914664.39,
        volume: 228207336.52,
        user_name: '0x2c335066FE58fe9237c3d3Dc7b275C2a034a0563-1759935795465',
        profile_image: '',
        x_username: '',
        verified: false,
      },
      {
        rank: 2,
        user_id: '0x1111222233334444555566667777888899990000',
        pnl: 2312775.1,
        volume: 12536386.4,
        user_name: 'balthazar',
        profile_image: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/avatar.png',
        x_username: '@balthazarpoly',
        verified: true,
      },
      {
        rank: 3,
        user_id: 'invalid-address',
        pnl: 100,
        volume: 100,
      },
    ]);

    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.displayName, '0x2c33...0563');
    assert.equal(rows[0]?.isAnonAddress, true);
    assert.equal(rows[0]?.polymarketUrl, buildPolymarketProfileUrl('0x2c335066fe58fe9237c3d3dc7b275c2a034a0563'));

    assert.equal(rows[1]?.displayName, 'balthazar');
    assert.equal(rows[1]?.xUsername, 'balthazarpoly');
    assert.equal(rows[1]?.verified, true);
    assert.ok(rows[1]?.profileImage?.startsWith('https://'));

    assert.equal(filterLiveLeaderboardTraders(rows, 'balthazarpoly').length, 1);
    assert.equal(filterLiveLeaderboardTraders(rows, '0x2c33').length, 1);
    assert.equal(normalizePolymarketV2Row({ user_id: '' }), null);
  });

  it('normalizes live trader positions, trades, timestamps, and offline fallbacks', () => {
    const pos = normalizeTraderPosition({
      title: 'Will Fed cut rates?',
      outcome: 'Yes',
      avg_price: 0.62,
      current_price: 0.71,
      current_value: 42500,
      total_pnl: 5400,
      percent_pnl: 14.5,
      slug: 'fed-cut',
    });
    assert.equal(pos?.avgPriceCents, 62);
    assert.equal(pos?.currentPriceCents, 71);
    assert.equal(pos?.outcome, 'Yes');

    const trade = normalizeTraderTrade({
      side: 'buy',
      outcome: 'Yes',
      title: 'BTC > $105k',
      size: 1000,
      price: 0.64,
      timestamp: 1700000000,
    });
    assert.equal(trade?.side, 'BUY');
    assert.equal(trade?.usdcValue, 640);
    assert.equal(trade?.priceCents, 64);

    assert.equal(formatRelativeTime(1000, 1_000_000 + 180_000), '3m ago');
    assert.equal(formatRelativeTime(1000, 1_000_000 + 7_200_000), '2h ago');

    const fallback = fallbackToLiveEntries({
      timeframe: 'month',
      category: 'Politics',
      sortBy: 'pnl',
      search: '',
    });
    assert.ok(fallback.length >= 2);
    assert.equal(fallback[0]?.rank, 1);
  });
});
