import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildShareCardModel,
  resolveShareCardVariant,
  type ShareCardUserInput,
} from './share-card';

const DEMO_USER: ShareCardUserInput = {
  displayName: 'Alex Web3',
  handle: '@alex_web3',
  avatarUrl: '/avatar.png',
  initials: 'AW',
  referralCode: 'OKN9912',
  portfolioUsd: 1428.5,
  referralUsd: 142.5,
  okPoints: 135,
  streakDays: 6,
  inviteCount: 14,
  tierLabel: 'Tier 2 · 12.5%',
};

describe('share-card logic & ShareCardOverride', () => {
  it('resolves wallet and portfolio routes to portfolio variant', () => {
    assert.equal(resolveShareCardVariant('/en/app/portfolio'), 'portfolio');
    assert.equal(resolveShareCardVariant('/en/app/wallet'), 'portfolio');
    assert.equal(resolveShareCardVariant('/en/app/referral'), 'referrals');
    assert.equal(resolveShareCardVariant('/en/app/settings'), 'profile');
  });

  it('builds default portfolio model when no override is supplied', () => {
    const model = buildShareCardModel(DEMO_USER, 'portfolio', '30d', 'usd');
    assert.equal(model.badgeLabel, 'Portfolio');
    assert.equal(model.headlineValue, '$1,428.50');
    assert.equal(model.subMetrics.length, 3);
  });

  it('applies ShareCardOverride from individual asset or activity cards', () => {
    const model = buildShareCardModel(DEMO_USER, 'portfolio', '7d', 'usd', {
      badgeLabel: 'BNB Smart Chain',
      headlineValue: '1.45 BNB',
      deltaLabel: '$870.00 USD · +4.2% (24h)',
      subMetrics: [
        { label: 'USD Value', value: '$870.00', tone: 'emerald' },
        { label: 'Network', value: 'BEP-20 (BSC)' },
        { label: 'Allocation', value: '60.9% Vault', tone: 'purple' },
      ],
      shareSummary: 'Holding 1.45 BNB ($870.00) in my OKNexus BSC Custody Vault!',
    });

    assert.equal(model.badgeLabel, 'BNB Smart Chain');
    assert.equal(model.headlineValue, '1.45 BNB');
    assert.equal(model.deltaLabel, '$870.00 USD · +4.2% (24h)');
    assert.equal(model.subMetrics[0]?.value, '$870.00');
    assert.equal(
      model.shareSummary,
      'Holding 1.45 BNB ($870.00) in my OKNexus BSC Custody Vault!',
    );
  });
});
