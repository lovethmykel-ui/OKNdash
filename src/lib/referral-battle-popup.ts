export const REFERRAL_BATTLE_SESSION_KEY = 'okn_referral_battle_popup_shown';
export const REFERRAL_BATTLE_FRESH_LOGIN_EVENT = 'okn:fresh-login';
export const REFERRAL_BATTLE_OPEN_EVENT = 'okn:open-referral-battle';

export interface StorageReader {
  getItem(key: string): string | null;
}

export interface StorageWriter {
  setItem(key: string, value: string): void;
}

export interface StorageRemover {
  removeItem(key: string): void;
}

export interface ReferralBattlePrize {
  rank: '01' | '02' | '03';
  placeLabel: string;
  title: string;
  tier: 'gold' | 'silver' | 'bronze';
  imageSrc: string;
  imageAlt: string;
}

export const REFERRAL_BATTLE_PRIZES: readonly ReferralBattlePrize[] = [
  {
    rank: '01',
    placeLabel: '1st PRIZE:',
    title: 'iPhone Duo',
    tier: 'gold',
    imageSrc: '/assets/referral-battle/iphone-duo.png',
    imageAlt: 'iPhone Duo foldable smartphone',
  },
  {
    rank: '02',
    placeLabel: '2nd PRIZE:',
    title: 'iPhone 18 Pro Max',
    tier: 'silver',
    imageSrc: '/assets/referral-battle/iphone-18-pro-max.png',
    imageAlt: 'iPhone 18 Pro Max deep burgundy smartphone',
  },
  {
    rank: '03',
    placeLabel: '3rd PRIZE:',
    title: 'iPhone 17 Air',
    tier: 'bronze',
    imageSrc: '/assets/referral-battle/iphone-17-air.png',
    imageAlt: 'iPhone 17 Air silver-white smartphone',
  },
] as const;

/**
 * In-memory flag scoped to the current loaded document (resets automatically on
 * any browser reload / fresh app entry or explicit fresh login, while staying
 * suppressed across client-side tab/sidebar route changes in the same session).
 */
let shownInCurrentDocumentLoad = false;

export function shouldShowReferralBattleOnFreshLoad(): boolean {
  return !shownInCurrentDocumentLoad;
}

export function markReferralBattleShownInDocument(): void {
  shownInCurrentDocumentLoad = true;
}

export function resetReferralBattleDocumentLoadFlag(): void {
  shownInCurrentDocumentLoad = false;
}

export function shouldShowReferralBattlePopup(
  storage: StorageReader | null | undefined,
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(REFERRAL_BATTLE_SESSION_KEY) !== '1';
  } catch {
    return false;
  }
}

export function markReferralBattlePopupShown(
  storage: StorageWriter | null | undefined,
): void {
  shownInCurrentDocumentLoad = true;
  if (!storage) return;
  try {
    storage.setItem(REFERRAL_BATTLE_SESSION_KEY, '1');
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

export function resetReferralBattlePopupForFreshLogin(
  storage?: StorageRemover | null,
  dispatchLoginEvent = true,
): void {
  shownInCurrentDocumentLoad = false;

  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
        ? window.sessionStorage
        : null;

  if (targetStorage) {
    try {
      targetStorage.removeItem(REFERRAL_BATTLE_SESSION_KEY);
    } catch {
      // Ignore storage access errors
    }
  }

  if (dispatchLoginEvent && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REFERRAL_BATTLE_FRESH_LOGIN_EVENT));
  }
}

export function openReferralBattlePopup(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REFERRAL_BATTLE_OPEN_EVENT));
  }
}
