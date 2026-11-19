import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  REFERRAL_BATTLE_PRIZES,
  REFERRAL_BATTLE_SESSION_KEY,
  markReferralBattlePopupShown,
  markReferralBattleShownInDocument,
  resetReferralBattleDocumentLoadFlag,
  resetReferralBattlePopupForFreshLogin,
  shouldShowReferralBattleOnFreshLoad,
  shouldShowReferralBattlePopup,
} from './referral-battle-popup.ts';

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

describe('referral-battle-popup session helpers', () => {
  it('shows popup on a fresh document load and hides after marked shown until fresh login', () => {
    resetReferralBattleDocumentLoadFlag();
    assert.equal(shouldShowReferralBattleOnFreshLoad(), true);

    markReferralBattleShownInDocument();
    assert.equal(shouldShowReferralBattleOnFreshLoad(), false);

    resetReferralBattlePopupForFreshLogin(null, false);
    assert.equal(shouldShowReferralBattleOnFreshLoad(), true);
  });

  it('shows popup on a fresh storage session and hides once marked as shown', () => {
    const storage = createMemoryStorage();
    assert.equal(shouldShowReferralBattlePopup(storage), true);

    markReferralBattlePopupShown(storage);
    assert.equal(storage.getItem(REFERRAL_BATTLE_SESSION_KEY), '1');
    assert.equal(shouldShowReferralBattlePopup(storage), false);
  });

  it('shows popup again after resetReferralBattlePopupForFreshLogin', () => {
    const storage = createMemoryStorage();
    markReferralBattlePopupShown(storage);
    assert.equal(shouldShowReferralBattlePopup(storage), false);

    resetReferralBattlePopupForFreshLogin(storage, false);
    assert.equal(shouldShowReferralBattlePopup(storage), true);
  });

  it('handles unavailable or throwing storage safely', () => {
    assert.equal(shouldShowReferralBattlePopup(null), false);
    assert.equal(
      shouldShowReferralBattlePopup({
        getItem() {
          throw new Error('blocked');
        },
      }),
      false,
    );
  });

  it('defines the three referral battle prizes in rank order with valid local assets', () => {
    assert.equal(REFERRAL_BATTLE_PRIZES.length, 3);
    assert.deepEqual(
      REFERRAL_BATTLE_PRIZES.map((p) => [p.rank, p.title]),
      [
        ['01', 'iPhone Duo'],
        ['02', 'iPhone 18 Pro Max'],
        ['03', 'iPhone 17 Air'],
      ],
    );
    assert.deepEqual(
      REFERRAL_BATTLE_PRIZES.map((p) => p.imageSrc),
      [
        '/assets/referral-battle/iphone-duo.png',
        '/assets/referral-battle/iphone-18-pro-max.png',
        '/assets/referral-battle/iphone-17-air.png',
      ],
    );
  });
});
