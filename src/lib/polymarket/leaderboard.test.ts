import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeterministicSparkline,
  buildPolymarketProfileUrl,
  canEngageLiveCopy,
  computeReturnOnVolumePct,
  computeWhalePerformance,
  filterLiveLeaderboardTraders,
  formatCompactUsd,
  formatPolymarketUsername,
  formatRelativeTime,
  formatSignedPct,
  isValidEvmAddress,
  isValidPaginationCursor,
  normalizePolymarketV2Row,
  normalizePolymarketV2Rows,
  normalizeTraderActivity,
  normalizeTraderPosition,
  sanitizeHttpsUrl,
  shortenEvmAddress,
  summarizeLeaderboardHero,
  toPolymarketCategory,
  toPolymarketSortBy,
  toPolymarketTimePeriod,
} from './leaderboard';

describe('Polymarket Data API v2 Leaderboard helpers', () => {
  it('maps UI filters to exact Polymarket Data API v2 query params', () => {
    assert.equal(toPolymarketTimePeriod('day'), 'day');
    assert.equal(toPolymarketTimePeriod('week'), 'week');
    assert.equal(toPolymarketTimePeriod('month'), 'month');
    assert.equal(toPolymarketTimePeriod('all'), 'all');

    assert.equal(toPolymarketCategory('All'), 'overall');
    assert.equal(toPolymarketCategory('Politics'), 'politics');
    assert.equal(toPolymarketCategory('Finance'), 'finance');
    assert.equal(toPolymarketSortBy('pnl'), 'PNL');
    assert.equal(toPolymarketSortBy('volume'), 'VOLUME');
  });

  it('validates EVM addresses, pagination cursors, and HTTPS-only image URLs', () => {
    assert.equal(
      isValidEvmAddress('0x2c335066fe58fe9237c3d3dc7b275c2a034a0563'),
      true,
    );
    assert.equal(isValidEvmAddress('0x1234'), false);
    assert.equal(isValidEvmAddress('not-an-address'), false);

    assert.equal(isValidPaginationCursor('eyJvZmZzZXQiOjE4fQ=='), true);
    assert.equal(isValidPaginationCursor('bad cursor with spaces!'), false);

    assert.equal(
      sanitizeHttpsUrl('https://polymarket-upload.s3.us-east-2.amazonaws.com/a.png'),
      'https://polymarket-upload.s3.us-east-2.amazonaws.com/a.png',
    );
    assert.equal(sanitizeHttpsUrl('javascript:alert(1)'), null);
    assert.equal(sanitizeHttpsUrl('http://insecure.example/a.png'), null);
    assert.equal(sanitizeHttpsUrl(''), null);
  });

  it('formats compact USD, signed percentages, and short EVM addresses cleanly', () => {
    assert.equal(formatCompactUsd(2_140_500, true), '+$2.14M');
    assert.equal(formatCompactUsd(142_800, true), '+$142.8K');
    assert.equal(formatCompactUsd(-42_500, true), '-$42.5K');
    assert.equal(formatCompactUsd(450, false), '$450');
    assert.equal(formatSignedPct(12.345), '+12.35%');
    assert.equal(formatSignedPct(-4.5), '-4.50%');
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

  it('collapses anonymous 0x-timestamp Polymarket handles and keeps custom usernames', () => {
    const anon = formatPolymarketUsername(
      '0x2c335066FE58fe9237c3d3Dc7b275C2a034a0563-1759935795465',
      '0x2c335066fe58fe9237c3d3dc7b275c2a034a0563',
    );
    assert.deepEqual(anon, { displayName: '0x2c33...0563', isAnonAddress: true });

    const named = formatPolymarketUsername(
      'balthazar',
      '0x1111111111111111111111111111111111111111',
    );
    assert.deepEqual(named, { displayName: 'balthazar', isAnonAddress: false });
  });

  it('normalizes v2 leaderboard rows, computes ROI & hero summary, and filters search', () => {
    const rows = normalizePolymarketV2Rows([
      {
        rank: 1,
        user_id: '0x2c335066fe58fe9237c3d3dc7b275c2a034a0563',
        pnl: 3_914_664.39,
        volume: 228_207_336.52,
        user_name: '0x2c335066FE58fe9237c3d3Dc7b275C2a034a0563-1759935795465',
        profile_image: '',
        x_username: '',
        verified: false,
      },
      {
        rank: 2,
        user_id: '0x1111222233334444555566667777888899990000',
        pnl: 2_312_775.1,
        volume: 12_536_386.4,
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
    assert.equal(
      rows[0]?.polymarketUrl,
      buildPolymarketProfileUrl('0x2c335066fe58fe9237c3d3dc7b275c2a034a0563'),
    );

    assert.equal(rows[1]?.displayName, 'balthazar');
    assert.equal(rows[1]?.xUsername, 'balthazarpoly');
    assert.equal(rows[1]?.verified, true);
    assert.equal(rows[1]?.roiPct, computeReturnOnVolumePct(2_312_775.1, 12_536_386.4));

    assert.equal(filterLiveLeaderboardTraders(rows, 'balthazarpoly').length, 1);
    assert.equal(filterLiveLeaderboardTraders(rows, '0x2c33').length, 1);
    assert.equal(normalizePolymarketV2Row({ user_id: '' }), null);

    const summary = summarizeLeaderboardHero(rows);
    assert.equal(summary.trackedCount, 2);
    assert.equal(summary.profitableCount, 2);
    assert.ok(summary.combinedPnlUsd > 6_000_000);
  });

  it('normalizes live v2 positions, activities, performance summary, and deterministic sparklines', () => {
    const pos1 = normalizeTraderPosition({
      title: 'Will Fed cut rates?',
      outcome: 'Yes',
      avg_price: 0.62,
      current_price: 0.71,
      current_value: 42500,
      entry_cost_usdc: 37100,
      total_pnl: 5400,
      percent_pnl: 14.5,
      status: 'OPEN',
      slug: 'fed-cut',
    });
    const pos2 = normalizeTraderPosition({
      title: 'Oil above $100?',
      outcome: 'No',
      avg_price: 0.55,
      current_price: 0.48,
      current_value: 17500,
      entry_cost_usdc: 20000,
      total_pnl: -2500,
      percent_pnl: -12.5,
      status: 'OPEN',
      slug: 'oil-100',
    });

    assert.ok(pos1 && pos2);
    assert.equal(pos1.avgPriceCents, 62);
    assert.equal(pos1.currentPriceCents, 71);

    const perf = computeWhalePerformance([pos1, pos2]);
    assert.equal(perf.openPositionsCount, 2);
    assert.equal(perf.winsCount, 1);
    assert.equal(perf.lossesCount, 1);
    assert.equal(perf.winRatePct, 50);
    assert.equal(perf.avgPositionSizeUsd, 30000);

    const trade = normalizeTraderActivity({
      type: 'TRADE',
      side: 'BUY',
      outcome: 'Yes',
      title: 'BTC > $105k',
      size: 1000,
      usdc_size: 640,
      price: 0.64,
      timestamp: 1700000000,
      transaction_hash: '0xabc',
    });
    assert.equal(trade?.side, 'BUY');
    assert.equal(trade?.usdcValue, 640);
    assert.equal(trade?.priceCents, 64);

    assert.equal(formatRelativeTime(1000, 1_000_000 + 180_000), '3m ago');
    assert.equal(formatRelativeTime(1000, 1_000_000 + 7_200_000), '2h ago');
    assert.equal(formatRelativeTime(1000, null), 'Live');

    const sparkA = buildDeterministicSparkline(
      '0x2c335066fe58fe9237c3d3dc7b275c2a034a0563',
      500_000,
      2_000_000,
    );
    const sparkB = buildDeterministicSparkline(
      '0x2c335066fe58fe9237c3d3dc7b275c2a034a0563',
      500_000,
      2_000_000,
    );
    assert.deepEqual(sparkA, sparkB);
    assert.equal(sparkA.length, 18);
    assert.equal(sparkA[sparkA.length - 1], 1);
  });
});
