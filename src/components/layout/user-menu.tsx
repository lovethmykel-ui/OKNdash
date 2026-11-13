'use client';

/**
 * components/layout/user-menu.tsx
 *
 * Avatar button in the top-right of the dashboard header. Opens a dropdown
 * with quick links (Settings, Wallet, Referral), an inline theme toggle, and
 * a separated, destructive Sign-out action.
 *
 * Uses a deterministic state + outside-click dropdown (matching NotificationBell
 * and LanguageSwitcher) so SSR and client hydration never have Radix Popper ID mismatches.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AreaThemeSwitch, useDarkClass } from '@/components/layout/area-theme';
import { SocialIconRow } from '@/components/landing/social-sidebar';
import { useMe } from '@/lib/hooks/use-me';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import { LogOut, Settings, Users, Wallet } from 'lucide-react';
import type { MeUser } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { apexOrigin } from '@/lib/domains';

/** Build a 1-2 character fallback from the user's name/username. */
function initialsOf(user: MeUser): string {
  const first = (user.firstName ?? '').trim();
  const last = (user.lastName ?? '').trim();
  const fi = first[0];
  const li = last[0];
  if (fi && li) return (fi + li).toUpperCase();
  if (fi) return first.slice(0, 2).toUpperCase();
  if (user.username) return user.username.slice(0, 2).toUpperCase();
  if (user.walletAddress) return user.walletAddress.slice(2, 4).toUpperCase();
  return 'DE';
}

/** Dev-only placeholder shown when /api/me has resolved but no user row exists. */
const DEV_PLACEHOLDER_USER: MeUser = {
  id: '00000000-0000-0000-0000-000000000000',
  telegramId: '1234567890',
  username: 'okndev',
  firstName: 'Dan',
  lastName: 'Evans',
  photoUrl: null,
  email: 'dan.evans@example.com',
  emailVerifiedAt: null,
  walletAddress: null,
  walletBoundAt: null,
  adminRole: null,
  twoFactorEnabled: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

export function UserMenu() {
  const t = useTranslations('dashboard.userMenu');
  const tSocial = useTranslations('socialSidebar');
  const hydrated = useHydrated();
  const { data } = useMe();
  const darkClass = useDarkClass();
  const realUser = hydrated ? (data?.user ?? null) : null;
  const user = realUser ?? DEV_PLACEHOLDER_USER;

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href={`${apexOrigin()}/login`}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        {t('signIn')}
      </Link>
    );
  }

  const first = (user.firstName ?? '').trim();
  const last = (user.lastName ?? '').trim();
  const fallbackId = user.telegramId
    ? user.telegramId.slice(-4)
    : user.walletAddress
      ? user.walletAddress.slice(2, 6)
      : 'anon';
  const displayName =
    first && last
      ? `${first} ${last}`
      : first ||
        user.username ||
        (user.walletAddress
          ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
          : t('userFallback', { id: fallbackId }));
  const subLine = user.username
    ? `@${user.username}`
    : user.telegramId
      ? t('telegramLabel', { id: user.telegramId })
      : user.walletAddress
        ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
        : '';

  const handleSignOut = async () => {
    setOpen(false);
    window.location.href = '/app/portfolio';
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t('openMenu')}
        aria-expanded={open}
        className="group flex size-9 md:size-10 shrink-0 items-center justify-center rounded-full bg-[#7A12F5] text-white font-extrabold text-xs md:text-sm shadow-[0_0_12px_rgba(122,18,245,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        {user.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoUrl} alt={displayName} className="size-9 md:size-10 rounded-full object-cover" />
        ) : (
          <span>{initialsOf(user)}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-full z-50 mt-2 min-w-64 rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-2 text-[var(--tx)] shadow-2xl',
            darkClass,
          )}
        >
          {/* Identity header */}
          <div className="flex items-center gap-3 rounded-xl bg-[var(--s2)] px-3 py-2.5 text-left">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7A12F5] to-[#09B4FF] text-xs font-extrabold text-white shadow-xs">
              {user.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoUrl} alt={displayName} className="size-full rounded-xl object-cover" />
              ) : (
                <span>{initialsOf(user)}</span>
              )}
            </div>
            <div className="grid flex-1 text-left leading-tight min-w-0">
              <span className="truncate text-sm font-extrabold text-[var(--tx)]">{displayName}</span>
              <span className="truncate text-xs font-medium text-[var(--mut)]">{subLine}</span>
            </div>
          </div>

          <div className="my-1.5 h-px bg-[var(--line)]" />

          <div className="space-y-0.5">
            <Link
              href="/app/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[var(--tx)] hover:bg-[var(--s2)] transition-colors"
            >
              <Settings className="size-4 text-[#C9A6FF]" />
              <span>{t('settings')}</span>
            </Link>
            <Link
              href="/app/wallet"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[var(--tx)] hover:bg-[var(--s2)] transition-colors"
            >
              <Wallet className="size-4 text-[#2FBD8E]" />
              <span>{t('wallet')}</span>
            </Link>
            <Link
              href="/app/referral"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[var(--tx)] hover:bg-[var(--s2)] transition-colors"
            >
              <Users className="size-4 text-[#09B4FF]" />
              <span>{t('referral')}</span>
            </Link>
          </div>

          <div className="my-1.5 h-px bg-[var(--line)]" />

          {/* Inline appearance switch */}
          <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2">
            <span className="text-xs sm:text-sm font-bold text-[var(--mut)]">{t('appearance')}</span>
            <AreaThemeSwitch />
          </div>

          {/* Community social links */}
          <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
            <span className="text-[11px] font-bold text-[var(--mut)]">{tSocial('ariaLabel')}</span>
            <div className="mt-1.5">
              <SocialIconRow />
            </div>
          </div>

          <div className="my-1.5 h-px bg-[var(--line)]" />

          {/* Sign out */}
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs sm:text-sm font-extrabold text-[#EF4444] hover:bg-[#EF4444]/15 transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>{t('signOut')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
