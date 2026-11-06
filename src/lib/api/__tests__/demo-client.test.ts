import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  api,
  getDemoOknBalanceWei,
  getDemoWalletAddress,
} from '../client';
import {
  fetchWallet,
  fetchSubscriptions,
  createSubscription,
  fetchFees,
  fetchBilling,
  subscribePro,
} from '../../../components/polymarket-agent/copier-hooks';

describe('Demo API Client', () => {
  it('returns seeded demo user and updates profile in-memory', async () => {
    const initial = await api.getMe();
    assert.ok(initial.user);
    assert.equal(initial.user.username, 'okndev');

    const updated = await api.updateProfile({ firstName: 'Alex', lastName: 'Morgan' });
    assert.equal(updated.user.firstName, 'Alex');
    assert.equal(updated.user.lastName, 'Morgan');
  });

  it('completes a task and increments user points in portfolio', async () => {
    const beforePortfolio = await api.getPortfolio();
    const tasks = await api.getTasks();
    const pendingTask = tasks.find((t) => t.completionStatus === null);
    assert.ok(pendingTask, 'Expected at least one incomplete task');

    const completion = await api.completeTask(pendingTask.id);
    assert.equal(completion.status, 'verified');

    const afterPortfolio = await api.getPortfolio();
    assert.equal(afterPortfolio.totalEarned, beforePortfolio.totalEarned + pendingTask.rewardPoints);
  });

  it('returns leaderboard entries and active community missions', async () => {
    const lb = await api.getLeaderboard({ category: 'referrals', period: 'all_time' });
    assert.ok(lb.entries.length >= 5);
    assert.ok(lb.myRank);

    const missions = await api.getMissions();
    assert.ok(missions.missions.length >= 2);
  });

  it('supports Polymarket copier demo state and PRO upgrade', async () => {
    const wallet = await fetchWallet();
    assert.equal(wallet.ok, true);
    assert.ok(wallet.data?.address.startsWith('0x'));

    const fees = await fetchFees();
    assert.equal(fees.ok, true);
    assert.equal(fees.data?.accruedUsdc, '18.40');

    const createdSub = await createSubscription({
      traderAddress: '0x1111111111111111111111111111111111111111',
      strategyConfig: {
        strategy: 'FIXED',
        copySize: 25,
        maxOrderSizeUsd: 100,
        minOrderSizeUsd: 10,
      },
    });
    assert.equal(createdSub.ok, true);

    const subs = await fetchSubscriptions();
    assert.ok((subs.data?.length ?? 0) >= 3);

    const pro = await subscribePro({ paymentSource: 'copier_wallet', consent: true });
    assert.equal(pro.ok, true);

    const billing = await fetchBilling();
    assert.equal(billing.data?.tier, 'pro');
  });

  it('tracks demo on-chain $OKN balance, purchases, claims, and wallet switching', async () => {
    const initialBal = getDemoOknBalanceWei();
    assert.ok(initialBal > 0n);

    await api.recordDemoPurchase(10n ** 18n, 250_000n * 10n ** 18n);
    const afterPurchaseBal = getDemoOknBalanceWei();
    assert.equal(afterPurchaseBal, initialBal + 250_000n * 10n ** 18n);

    const claim = await api.recordDemoClaim(100_000n * 10n ** 18n);
    assert.ok(claim.txHash.startsWith('0x'));

    const initialAddr = getDemoWalletAddress();
    const nextWallet = await api.cycleDemoWallet();
    assert.notEqual(nextWallet.walletAddress, initialAddr);
  });
});
