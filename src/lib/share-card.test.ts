import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveShareCardVariant,
  buildShareCardModel,
  buildChartSvgPaths,
  type ShareCardUserInput,
} from './share-card';

const SAMPLE_USER: ShareCardUserInput = {
  displayName: 'Alex Mercer',
  handle: '@alex_okn',
  avatarUrl: null,
  initials: 'AM',
  referralCode: 'ref_dev',
  portfolioUsd: 1428.5,
  referralUsd: 142.5,
  okPoints: 135,
  streakDays: 6,
  inviteCount: 14,
  tierLabel: 'Tier 2',
};

test('resolveShareCardVariant maps portfolio, referral, and profile routes with or without locale prefix', () => {
  assert.equal(resolveShareCardVariant('/app/portfolio'), 'portfolio');
  assert.equal(resolveShareCardVariant('/en/app/portfolio'), 'portfolio');
  assert.equal(resolveShareCardVariant('/app'), 'portfolio');
  assert.equal(resolveShareCardVariant('/app/referral'), 'referrals');
  assert.equal(resolveShareCardVariant('/fr/app/referral'), 'referrals');
  assert.equal(resolveShareCardVariant('/app/settings'), 'profile');
  assert.equal(resolveShareCardVariant('/en/app/settings'), 'profile');
  assert.equal(resolveShareCardVariant('/app/buy'), null);
  assert.equal(resolveShareCardVariant('/app/agents'), null);
  assert.equal(resolveShareCardVariant(null), null);
});

test('buildShareCardModel produces deterministic portfolio, referrals, and profile cards across units and timeframes', () => {
  const portfolioUsd = buildShareCardModel(SAMPLE_USER, 'portfolio', '24h', 'usd');
  assert.equal(portfolioUsd.headlineValue, '$1,428.50');
  assert.equal(portfolioUsd.deltaLabel, '+$142.50');
  assert.equal(portfolioUsd.badgeLabel, 'Portfolio');
  assert.equal(portfolioUsd.series.length, 16);

  const portfolioPct = buildShareCardModel(SAMPLE_USER, 'portfolio', '7d', 'pct');
  assert.equal(portfolioPct.deltaLabel, '+28.6%');
  assert.equal(portfolioPct.timeframeLabel, '7d');

  const referralsCard = buildShareCardModel(SAMPLE_USER, 'referrals', '30d', 'usd');
  assert.equal(referralsCard.headlineValue, '$142.50');
  assert.equal(referralsCard.badgeLabel, 'Referrals');
  assert.ok(referralsCard.shareSummary.includes('ref_dev'));

  const profileCard = buildShareCardModel(SAMPLE_USER, 'profile', '24h', 'usd');
  assert.equal(profileCard.headlineValue, '135 OK Pts');
  assert.equal(profileCard.deltaLabel, '+25 pts');
  assert.equal(profileCard.badgeLabel, 'Profile');
});

test('buildChartSvgPaths returns valid SVG path coordinates within bounds', () => {
  const { linePath, areaPath, endPoint } = buildChartSvgPaths([100, 120, 150, 180], 300, 160);
  assert.ok(linePath.startsWith('M 0 '));
  assert.ok(areaPath.endsWith('Z'));
  assert.equal(endPoint.x, 300);
  assert.ok(endPoint.y >= 16 && endPoint.y <= 140);
});
