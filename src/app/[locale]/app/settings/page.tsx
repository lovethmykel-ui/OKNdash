'use client';

/**
 * /app/settings — Redesigned User Self-Service Settings & Account Hub.
 *
 * Architecture:
 *   - Top Account Identity & Readiness Banner (Avatar, @username, joined date, quick copyable wallet & status)
 *   - Responsive Navigation:
 *       · Mobile (< lg): Clean single-line horizontal segmented bar (no multi-line wrapping)
 *       · Desktop (lg+): 12-column split with Left Vertical Settings Rail (4 cols) + Active Workspace (8 cols)
 *   - Six Sections:
 *       1. Profile    — Editable display name + read-only Telegram & account identity rows
 *       2. Email      — Bind / change / remove / verify email with 6-digit OTP flow
 *       3. Wallet     — Bound BSC wallet inspection, copy, and deep link to /app/wallet
 *       4. Security   — Shared TOTP 2FA authenticator setup & recovery codes
 *       5. Appearance — Interactive Dark / Light mode visual cards + notification preferences
 *       6. Session    — Community channels, legal links, and session sign-out
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  AtSign,
  Bell,
  CalendarClock,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  Moon,
  Palette,
  Send,
  Shield,
  ShieldCheck,
  Sun,
  User,
  UserCircle,
  Wallet as WalletIcon,
} from 'lucide-react';
import { SocialIconRow } from '@/components/landing/social-sidebar';
import { useToast } from '@/components/ui/use-toast';
import { AreaThemeSwitch, useTheme } from '@/components/layout/area-theme';
import { TwoFactorCard } from '@/components/settings/two-factor-card';
import {
  useMe,
  useUpdateProfile,
  useSendEmailVerification,
  useVerifyEmail,
} from '@/lib/hooks/use-me';
import type { MeUser } from '@/lib/api/client';
import { OknWatermark } from '@/components/ui/okn-watermark';
import { cn } from '@/lib/utils';

const TERMS_URL = '/terms';
const PRIVACY_URL = '/privacy';

const DEV_SEED_USER: MeUser = {
  id: '00000000-0000-0000-0000-000000000000',
  telegramId: '1234567890',
  username: 'okndev',
  firstName: 'Alex',
  lastName: 'Morgan',
  photoUrl: null,
  email: 'alex.morgan@example.com',
  emailVerifiedAt: null,
  walletAddress: '0xAb3F4c2D9e8a1B7C6d5E4f3A2b1C0d9E8f7A6B5c',
  walletBoundAt: '2026-01-14T09:32:00.000Z',
  adminRole: null,
  twoFactorEnabled: false,
  createdAt: '2025-11-03T14:20:00.000Z',
};

type SettingsTabKey = 'profile' | 'email' | 'wallet' | 'security' | 'appearance' | 'session';

type NotificationPrefs = {
  taskAlerts: boolean;
  missionAlerts: boolean;
};
const NOTIF_KEY = 'okn-prefs:notifications';
const DEFAULT_NOTIFS: NotificationPrefs = { taskAlerts: true, missionAlerts: true };

export default function SettingsPage() {
  const t = useTranslations('dashboard.settings');
  const { data, isLoading, isError } = useMe();
  const [activeTab, setActiveTab] = useState<SettingsTabKey>('profile');

  const realUser = data?.user ?? null;
  const devFallback = !isLoading && !realUser;
  const user = realUser ?? (devFallback ? DEV_SEED_USER : null);
  const showGuest = !isLoading && (!user || isError);

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.username ||
      t('anonymous')
    : t('anonymous');

  const shortWallet = user?.walletAddress
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : t('notBound');

  const navItems: {
    key: SettingsTabKey;
    label: string;
    subtitle: string;
    icon: typeof User;
  }[] = [
    {
      key: 'profile',
      label: t('tabProfile'),
      subtitle: user?.username ? `@${user.username}` : displayName,
      icon: User,
    },
    {
      key: 'email',
      label: t('tabEmail'),
      subtitle: user?.email || t('notSet'),
      icon: Mail,
    },
    {
      key: 'wallet',
      label: t('tabWallet'),
      subtitle: shortWallet,
      icon: WalletIcon,
    },
    {
      key: 'security',
      label: t('tabSecurity'),
      subtitle: user?.twoFactorEnabled ? t('verified') : 'Authenticator 2FA',
      icon: Shield,
    },
    {
      key: 'appearance',
      label: t('tabAppearance'),
      subtitle: t('themeLabel'),
      icon: Palette,
    },
    {
      key: 'session',
      label: t('tabSession'),
      subtitle: `${t('supportTitle')} · ${t('signOutTitle')}`,
      icon: LogOut,
    },
  ];

  return (
    <main className="space-y-5 md:space-y-6 pb-12">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--tx)]">
            {t('title')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--mut)]">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Top Account Identity & Readiness Banner */}
      {user && !showGuest ? (
        <section className="relative overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-6 shadow-sm">
          <OknWatermark variant="card" size="sm" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
            {/* Left: Avatar + Name + Unboxed Metadata */}
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="relative flex size-13 sm:size-15 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7A12F5] to-[#09B4FF] text-base sm:text-lg font-extrabold text-white shadow-[0_6px_20px_rgba(122,18,245,0.3)]">
                {user.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoUrl}
                    alt={displayName}
                    className="size-full rounded-2xl object-cover"
                  />
                ) : (
                  <span>{initials(user)}</span>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-[var(--tx)]">
                    {displayName}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--mut)] font-medium">
                  {user.username ? <span>@{user.username}</span> : null}
                  {user.username ? <span aria-hidden="true">·</span> : null}
                  <span>
                    {t('joinedOkn')}{' '}
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      timeZone: 'UTC',
                    })}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{shortWallet}</span>
                </div>
              </div>
            </div>

            {/* Right: 3-Column Account Status Strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 lg:pt-0 border-t border-[var(--line)] lg:border-t-0 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('email')}
                className="rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3 py-2 text-left hover:border-[#7A12F5]/40 transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-semibold text-[var(--mut)] whitespace-nowrap">
                  {t('tabEmail')}
                </div>
                <div
                  className={cn(
                    'mt-0.5 text-xs font-extrabold truncate',
                    user.emailVerifiedAt
                      ? 'text-[#2FBD8E]'
                      : user.email
                        ? 'text-[#F59E0B]'
                        : 'text-[var(--tx)]',
                  )}
                >
                  {user.emailVerifiedAt
                    ? t('verified')
                    : user.email
                      ? t('unverified')
                      : t('notSet')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className="rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3 py-2 text-left hover:border-[#7A12F5]/40 transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-semibold text-[var(--mut)] whitespace-nowrap">
                  {t('tabWallet')}
                </div>
                <div
                  className={cn(
                    'mt-0.5 text-xs font-extrabold font-mono tabular-nums truncate',
                    user.walletAddress ? 'text-[#2FBD8E]' : 'text-[var(--tx)]',
                  )}
                >
                  {user.walletAddress ? shortWallet : t('notBound')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className="rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3 py-2 text-left hover:border-[#7A12F5]/40 transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-semibold text-[var(--mut)] whitespace-nowrap">
                  2FA {t('tabSecurity')}
                </div>
                <div
                  className={cn(
                    'mt-0.5 text-xs font-extrabold truncate',
                    user.twoFactorEnabled ? 'text-[#2FBD8E]' : 'text-[var(--mut)]',
                  )}
                >
                  {user.twoFactorEnabled ? t('verified') : 'Off'}
                </div>
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Mobile Horizontal Segmented Navigation (< lg) */}
      <nav
        aria-label="Settings sections"
        className="flex lg:hidden items-center gap-1.5 overflow-x-auto no-scrollbar rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-1.5"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold whitespace-nowrap shrink-0 transition-all cursor-pointer',
                active
                  ? 'bg-[#7A12F5] text-white shadow-sm shadow-[#7A12F5]/30'
                  : 'text-[var(--mut)] hover:text-[var(--tx)] hover:bg-[var(--s2)]',
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main 12-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
        {/* Desktop Left Vertical Navigation Rail (lg:col-span-4) */}
        <aside className="hidden lg:flex lg:col-span-4 flex-col gap-4">
          <nav
            aria-label="Settings sections"
            className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-2.5 shadow-sm space-y-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-left transition-all cursor-pointer',
                    active
                      ? 'bg-[#7A12F5] text-white shadow-[0_4px_14px_rgba(122,18,245,0.3)]'
                      : 'text-[var(--tx)] hover:bg-[var(--s2)]',
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--s2)] text-[var(--mut)]',
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div
                        className={cn(
                          'text-sm font-extrabold leading-tight truncate',
                          active ? 'text-white' : 'text-[var(--tx)]',
                        )}
                      >
                        {item.label}
                      </div>
                      <div
                        className={cn(
                          'text-xs font-medium truncate mt-0.5',
                          active ? 'text-white/80' : 'text-[var(--mut)]',
                        )}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      'size-4 shrink-0 transition-transform',
                      active ? 'text-white translate-x-0.5' : 'text-[var(--mut)]',
                    )}
                  />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Active Section Content (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-5">
          {activeTab === 'profile' ? (
            <ProfileTab user={user} isLoading={isLoading} showGuest={showGuest} />
          ) : null}
          {activeTab === 'email' ? (
            <EmailTab user={user} isLoading={isLoading} showGuest={showGuest} />
          ) : null}
          {activeTab === 'wallet' ? (
            <WalletTab user={user} isLoading={isLoading} showGuest={showGuest} />
          ) : null}
          {activeTab === 'security' ? (
            <TwoFactorCard user={user} isLoading={isLoading} showGuest={showGuest} />
          ) : null}
          {activeTab === 'appearance' ? <AppearanceTab /> : null}
          {activeTab === 'session' ? <SessionTab /> : null}
        </div>
      </div>
    </main>
  );
}

/* ============ PROFILE ============ */

type TabStateProps = {
  user: MeUserLike | null;
  isLoading: boolean;
  showGuest: boolean;
};

function ProfileTab({ user, isLoading, showGuest }: TabStateProps) {
  const t = useTranslations('dashboard.settings');
  const tToast = useTranslations('toasts.settings');
  const { toast } = useToast();
  const update = useUpdateProfile();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [linkTgLoading, setLinkTgLoading] = useState(false);

  const handleLinkTelegram = async () => {
    setLinkTgLoading(true);
    try {
      toast({
        title: 'Telegram Bot Link Ready (Demo)',
        description: 'Connected to @okntest001_bot in demo mode.',
      });
    } finally {
      setLinkTgLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
    }
  }, [user?.id, user?.firstName, user?.lastName]);

  if (isLoading) return <SkeletonCard />;
  if (showGuest || !user) return <GuestCard />;

  const dirty = firstName !== (user.firstName ?? '') || lastName !== (user.lastName ?? '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim() },
      {
        onSuccess: () => toast({ title: tToast('profileUpdated') }),
        onError: (err) =>
          toast({
            title: tToast('profileFailed'),
            description: err.message,
            variant: 'destructive',
          }),
      },
    );
  };

  return (
    <div className="space-y-5">
      {/* Display Name Form Card */}
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-5">
        <div className="pb-4 border-b border-[var(--line)]">
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
            {t('displayNameTitle')}
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--mut)]">
            {t('displayNameDesc')}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="first-name"
                className="block text-xs sm:text-sm font-bold text-[var(--tx)]"
              >
                {t('firstNameLabel')}
              </label>
              <input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={64}
                placeholder={t('firstNamePlaceholder')}
                className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3.5 text-sm font-semibold text-[var(--tx)] placeholder:text-[var(--mut)]/60 outline-none focus:border-[#7A12F5] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="last-name"
                className="block text-xs sm:text-sm font-bold text-[var(--tx)]"
              >
                {t('lastNameLabel')}
              </label>
              <input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={64}
                placeholder={t('lastNamePlaceholder')}
                className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3.5 text-sm font-semibold text-[var(--tx)] placeholder:text-[var(--mut)]/60 outline-none focus:border-[#7A12F5] transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-[var(--mut)]">{t('avatarNote')}</p>
            <button
              type="submit"
              disabled={!dirty || update.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7A12F5] px-5 text-xs sm:text-sm font-extrabold text-white shadow-sm shadow-[#7A12F5]/25 hover:bg-[#8C38F7] disabled:opacity-45 transition-all cursor-pointer whitespace-nowrap"
            >
              {update.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              <span>{t('saveChanges')}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Telegram & Account Identity Card */}
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="pb-4 border-b border-[var(--line)]">
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
            {t('identityTitle')}
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--mut)]">
            {t('identityDesc')}
          </p>
        </div>

        <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--s2)]/60 px-4">
          {user.telegramId ? (
            <>
              <ReadonlyRow
                icon={AtSign}
                label={t('telegramUsername')}
                value={user.username ? `@${user.username}` : t('notSet')}
              />
              <ReadonlyRow
                icon={MessageCircle}
                label={t('telegramId')}
                value={<span className="font-mono tabular-nums">{user.telegramId}</span>}
              />
            </>
          ) : (
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--tx)]">
                    {t('telegramNotLinked')}
                  </span>
                  <span className="text-xs font-extrabold text-[#09B4FF]">· +50 OK Points</span>
                </div>
                <p className="text-xs text-[var(--mut)]">{t('telegramUnlinkedDesc')}</p>
              </div>
              <button
                type="button"
                onClick={handleLinkTelegram}
                disabled={linkTgLoading}
                className="shrink-0 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#09B4FF] px-4 text-xs font-extrabold text-white hover:opacity-90 transition-opacity cursor-pointer"
              >
                {linkTgLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                <span>{t('linkTelegramBtn')}</span>
              </button>
            </div>
          )}

          <ReadonlyRow
            icon={CalendarClock}
            label={t('joinedOkn')}
            value={new Date(user.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          />
          {user.adminRole ? (
            <ReadonlyRow
              icon={Shield}
              label={t('role')}
              value={<span className="font-bold">{user.adminRole.replace('_', ' ')}</span>}
            />
          ) : null}
          <ReadonlyRow
            icon={Shield}
            label={t('userId')}
            value={<CopyableValue value={user.id} mono />}
          />
        </div>
      </section>
    </div>
  );
}

/* ============ EMAIL ============ */

function EmailTab({ user, isLoading, showGuest }: TabStateProps) {
  const t = useTranslations('dashboard.settings');
  const tToast = useTranslations('toasts.settings');
  const { toast } = useToast();
  const update = useUpdateProfile();
  const sendVerification = useSendEmailVerification();
  const verify = useVerifyEmail();
  const [emailInput, setEmailInput] = useState('');
  const [mode, setMode] = useState<'view' | 'edit' | 'verify'>('view');
  const [codeInput, setCodeInput] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (user?.email) {
      setMode('view');
      setCodeInput('');
      setDevCode(null);
    }
  }, [user?.email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  if (isLoading) return <SkeletonCard />;
  if (showGuest || !user) return <GuestCard />;

  const submitEmail = (nextEmail: string) => {
    update.mutate(
      { email: nextEmail },
      {
        onSuccess: () => {
          toast({ title: nextEmail ? tToast('emailSaved') : tToast('emailRemoved') });
          setEmailInput('');
          if (nextEmail) setMode('view');
        },
        onError: (err) =>
          toast({
            title: tToast('emailFailed'),
            description: err.message,
            variant: 'destructive',
          }),
      },
    );
  };

  const handleBind = (e: React.FormEvent) => {
    e.preventDefault();
    submitEmail(emailInput.trim());
  };

  const startVerification = () => {
    setCodeInput('');
    setDevCode(null);
    setMode('verify');
    void sendCode();
  };

  const sendCode = () => {
    sendVerification.mutate(undefined, {
      onSuccess: (res) => {
        setCooldown(30);
        setDevCode(res.devCode ?? null);
        toast({ title: tToast('verificationSent') });
      },
      onError: (err) =>
        toast({
          title: tToast('verificationFailed'),
          description: err.message,
          variant: 'destructive',
        }),
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verify.mutate(codeInput.trim(), {
      onSuccess: () => {
        toast({ title: tToast('emailVerified'), description: t('verifySuccessDesc') });
        setMode('view');
        setCodeInput('');
        setDevCode(null);
      },
      onError: (err) =>
        toast({
          title: tToast('verificationFailed'),
          description: err.message,
          variant: 'destructive',
        }),
    });
  };

  const isVerified = Boolean(user.emailVerifiedAt);

  return (
    <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-start gap-3.5 pb-4 border-b border-[var(--line)]">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#7A12F5]/35 bg-[#7A12F5]/15 text-[#C9A6FF]">
          <Mail className="size-5 stroke-[2.2]" />
        </span>
        <div>
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
            {t('emailTitle')}
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--mut)]">
            {t('emailDesc')}
          </p>
        </div>
      </div>

      {user.email && mode === 'view' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4">
            <div className="flex min-w-0 items-center gap-3">
              <Mail className="size-4 shrink-0 text-[var(--mut)]" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-extrabold text-[var(--tx)]">
                    {user.email}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-bold',
                      isVerified ? 'text-[#2FBD8E]' : 'text-[#F59E0B]',
                    )}
                  >
                    · {isVerified ? t('verified') : t('unverified')}
                  </span>
                </div>
                <p className="text-xs text-[var(--mut)] mt-0.5">
                  {isVerified ? t('verifySuccessDesc') : t('verifyHint')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {!isVerified ? (
                <button
                  type="button"
                  onClick={startVerification}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-[#7A12F5] px-4 text-xs font-extrabold text-white shadow-xs hover:bg-[#8C38F7] transition-all cursor-pointer"
                >
                  {t('verify')}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s1)] px-3.5 text-xs font-bold text-[var(--tx)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
              >
                {t('change')}
              </button>
              <button
                type="button"
                onClick={() => submitEmail('')}
                className="inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold text-[var(--mut)] hover:text-[#EF4444] transition-colors cursor-pointer"
              >
                {t('remove')}
              </button>
            </div>
          </div>
        </div>
      ) : user.email && mode === 'verify' ? (
        <form onSubmit={handleVerify} className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 sm:p-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="verify-code" className="block text-xs sm:text-sm font-bold text-[var(--tx)]">
              {t('enterCode')}
            </label>
            <p className="text-xs text-[var(--mut)]">{t('enterCodeDesc')}</p>
            <input
              id="verify-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('codePlaceholder')}
              maxLength={6}
              className="h-11 w-full max-w-xs rounded-xl border border-[var(--line)] bg-[var(--s1)] px-4 font-mono text-lg font-bold tracking-[0.35em] text-[var(--tx)] outline-none focus:border-[#7A12F5] transition-colors tabular-nums"
              required
            />
          </div>
          {devCode ? (
            <p className="rounded-xl border border-[#09B4FF]/30 bg-[#09B4FF]/10 px-3.5 py-2 text-xs font-semibold text-[#09B4FF]">
              {t('devCodeHint')} <span className="font-mono font-bold">{devCode}</span>
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="submit"
              disabled={codeInput.length !== 6 || verify.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7A12F5] px-5 text-xs sm:text-sm font-extrabold text-white shadow-sm hover:bg-[#8C38F7] disabled:opacity-45 transition-all cursor-pointer"
            >
              {verify.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              <span>{t('submitCode')}</span>
            </button>
            <button
              type="button"
              onClick={sendCode}
              disabled={cooldown > 0 || sendVerification.isPending}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s1)] px-4 text-xs font-bold text-[var(--tx)] disabled:opacity-50 hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
            >
              {cooldown > 0 ? t('resendIn', { seconds: cooldown }) : t('resend')}
            </button>
            <button
              type="button"
              onClick={() => setMode('view')}
              className="inline-flex h-10 items-center justify-center rounded-xl px-3 text-xs font-bold text-[var(--mut)] hover:text-[var(--tx)] transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleBind} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-[var(--tx)]">
              {user.email ? t('newEmailTitle') : t('bindEmailTitle')}
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3.5 text-sm font-semibold text-[var(--tx)] placeholder:text-[var(--mut)]/60 outline-none focus:border-[#7A12F5] transition-colors"
              required
            />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="submit"
              disabled={!emailInput.trim() || update.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7A12F5] px-5 text-xs sm:text-sm font-extrabold text-white shadow-sm hover:bg-[#8C38F7] disabled:opacity-45 transition-all cursor-pointer"
            >
              {update.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              <span>{user.email ? t('submitUpdate') : t('submitBind')}</span>
            </button>
            {user.email ? (
              <button
                type="button"
                onClick={() => setMode('view')}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s2)] px-4 text-xs sm:text-sm font-bold text-[var(--tx)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
            ) : null}
          </div>
        </form>
      )}
    </section>
  );
}

/* ============ WALLET ============ */

function WalletTab({ user, isLoading, showGuest }: TabStateProps) {
  const t = useTranslations('dashboard.settings');
  if (isLoading) return <SkeletonCard />;
  if (showGuest || !user) return <GuestCard />;

  return (
    <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-start gap-3.5 pb-4 border-b border-[var(--line)]">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#2FBD8E]/35 bg-[#2FBD8E]/15 text-[#2FBD8E]">
          <WalletIcon className="size-5 stroke-[2.2]" />
        </span>
        <div>
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
            {t('walletTitle')}
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--mut)]">
            {t('walletDesc')}
          </p>
        </div>
      </div>

      {user.walletAddress ? (
        <div className="space-y-4">
          <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--s2)]/60 px-4">
            <ReadonlyRow
              icon={WalletIcon}
              label={t('boundAddress')}
              value={<CopyableValue value={user.walletAddress} mono />}
            />
            {user.walletBoundAt ? (
              <ReadonlyRow
                icon={CalendarClock}
                label={t('boundSince')}
                value={new Date(user.walletBoundAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              />
            ) : null}
            <ReadonlyRow
              icon={ShieldCheck}
              label="Network"
              value={<span className="text-xs font-extrabold text-[#2FBD8E]">BNB Smart Chain (BEP-20)</span>}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/app/wallet"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7A12F5] px-5 text-xs sm:text-sm font-extrabold text-white shadow-sm shadow-[#7A12F5]/25 hover:bg-[#8C38F7] transition-all"
            >
              <WalletIcon className="size-4" />
              <span>{t('manageWallet')}</span>
            </Link>
            <Link
              href="/app/wallet"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s2)] px-4 text-xs sm:text-sm font-bold text-[var(--tx)] hover:bg-[var(--line)]/50 transition-colors"
            >
              {t('requestRebind')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[var(--tx)]">{t('walletNotBound')}</span>
              <span className="text-xs font-extrabold text-[#F59E0B]">· +50 OK Points</span>
            </div>
            <p className="text-xs text-[var(--mut)]">{t('walletUnboundDesc')}</p>
          </div>
          <Link
            href="/app/wallet"
            className="shrink-0 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#7A12F5] px-4 text-xs font-extrabold text-white shadow-sm hover:bg-[#8C38F7] transition-all"
          >
            <WalletIcon className="size-3.5" />
            <span>{t('bindWalletRewardBadge')}</span>
          </Link>
        </div>
      )}
    </section>
  );
}

/* ============ APPEARANCE + NOTIFICATIONS ============ */

function AppearanceTab() {
  const t = useTranslations('dashboard.settings');
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NOTIF_KEY);
      if (raw) setPrefs({ ...DEFAULT_NOTIFS, ...JSON.parse(raw) });
    } catch {
      /* keep defaults */
    }
  }, []);

  const togglePref = (key: keyof NotificationPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      window.localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
      toast({
        title: 'Notification preference saved',
        description: 'Stored locally on this device.',
      });
    } catch {
      /* ignore private mode errors */
    }
  };

  return (
    <div className="space-y-5">
      {/* Theme Selection Card */}
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--line)]">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
              {t('appearanceTitle')}
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-[var(--mut)]">
              {t('appearanceDesc')}
            </p>
          </div>
          <AreaThemeSwitch />
        </div>

        {/* Visual Theme Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={cn(
              'flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all cursor-pointer',
              theme === 'dark'
                ? 'border-[#7A12F5] bg-[#7A12F5]/12 shadow-xs'
                : 'border-[var(--line)] bg-[var(--s2)] hover:border-[#7A12F5]/40',
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0D0F14] text-[#C9A6FF] border border-white/10">
                <Moon className="size-5" />
              </span>
              <div>
                <div className="text-sm font-extrabold text-[var(--tx)]">Dark Mode</div>
                <div className="text-xs text-[var(--mut)]">Deep obsidian Web3 surface</div>
              </div>
            </div>
            {theme === 'dark' ? (
              <span className="flex size-6 items-center justify-center rounded-full bg-[#7A12F5] text-white">
                <Check className="size-3.5 stroke-[2.5]" />
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setTheme('light')}
            className={cn(
              'flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all cursor-pointer',
              theme === 'light'
                ? 'border-[#7A12F5] bg-[#7A12F5]/12 shadow-xs'
                : 'border-[var(--line)] bg-[var(--s2)] hover:border-[#7A12F5]/40',
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#7A12F5] border border-slate-200 shadow-2xs">
                <Sun className="size-5" />
              </span>
              <div>
                <div className="text-sm font-extrabold text-[var(--tx)]">Light Mode</div>
                <div className="text-xs text-[var(--mut)]">Crisp daylight contrast</div>
              </div>
            </div>
            {theme === 'light' ? (
              <span className="flex size-6 items-center justify-center rounded-full bg-[#7A12F5] text-white">
                <Check className="size-3.5 stroke-[2.5]" />
              </span>
            ) : null}
          </button>
        </div>
      </section>

      {/* Notification Preferences Card */}
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3.5 pb-4 border-b border-[var(--line)]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#7A12F5]/35 bg-[#7A12F5]/15 text-[#C9A6FF]">
            <Bell className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
                {t('notificationsTitle')}
              </h2>
              <span className="text-xs font-bold text-[var(--mut)]">
                · {t('notificationsBadge')}
              </span>
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-[var(--mut)]">
              {t('notificationsDesc')}
            </p>
          </div>
        </div>

        <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--s2)]/60 px-4">
          <NotificationRow
            id="notif-tasks"
            label={t('notifTaskLabel')}
            description={t('notifTaskDesc')}
            checked={prefs.taskAlerts}
            onToggle={() => togglePref('taskAlerts')}
          />
          <NotificationRow
            id="notif-missions"
            label={t('notifMissionLabel')}
            description={t('notifMissionDesc')}
            checked={prefs.missionAlerts}
            onToggle={() => togglePref('missionAlerts')}
          />
        </div>

        <p className="text-xs text-[var(--mut)]">{t('notificationsComingSoon')}</p>
      </section>
    </div>
  );
}

function NotificationRow({
  id,
  label,
  description,
  checked,
  onToggle,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="space-y-0.5 min-w-0">
        <label htmlFor={id} className="block text-xs sm:text-sm font-bold text-[var(--tx)] cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-[var(--mut)] leading-relaxed">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer',
          checked ? 'bg-[#7A12F5]' : 'bg-[var(--line)]',
        )}
      >
        <span
          className={cn(
            'inline-block size-4.5 rounded-full bg-white shadow-xs transition-transform',
            checked ? 'translate-x-5.5' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  );
}

/* ============ SESSION ============ */

function SessionTab() {
  const t = useTranslations('dashboard.settings');
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    window.location.href = '/app/portfolio';
  };

  return (
    <div className="space-y-5">
      {/* Community & Support Card */}
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-5">
        <div className="pb-4 border-b border-[var(--line)]">
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
            {t('supportTitle')}
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--mut)]">
            {t('supportDesc')}
          </p>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-bold text-[var(--mut)]">{t('communityLabel')}</p>
          <SocialIconRow />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--line)]">
          <a
            href={TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3.5 text-xs font-bold text-[var(--tx)] hover:bg-[var(--line)]/50 transition-colors"
          >
            <FileText className="size-3.5 text-[var(--mut)]" />
            <span>{t('terms')}</span>
            <ExternalLink className="size-3 text-[var(--mut)]" />
          </a>
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3.5 text-xs font-bold text-[var(--tx)] hover:bg-[var(--line)]/50 transition-colors"
          >
            <Shield className="size-3.5 text-[var(--mut)]" />
            <span>{t('privacy')}</span>
            <ExternalLink className="size-3 text-[var(--mut)]" />
          </a>
        </div>
      </section>

      {/* Sign Out Card */}
      <section className="rounded-[24px] border border-[#EF4444]/30 bg-[var(--s1)] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#EF4444]">
            {t('signOutTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--mut)]">
            {t('signOutDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="shrink-0 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#EF4444] px-5 text-xs sm:text-sm font-extrabold text-white shadow-sm hover:bg-[#DC2626] disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
        >
          {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          <span>{t('signOutButton')}</span>
        </button>
      </section>
    </div>
  );
}

/* ============ SHARED HELPERS ============ */

type MeUserLike = NonNullable<NonNullable<ReturnType<typeof useMe>['data']>['user']>;

function initials(user: MeUserLike): string {
  const first = (user.firstName ?? '').trim();
  const last = (user.lastName ?? '').trim();
  const fi = first[0];
  const li = last[0];
  if (fi && li) return (fi + li).toUpperCase();
  if (fi) return first.slice(0, 2).toUpperCase();
  if (user.username) return user.username.slice(0, 2).toUpperCase();
  if (user.walletAddress) return user.walletAddress.slice(2, 4).toUpperCase();
  return '?';
}

function ReadonlyRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof AtSign;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <span className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[var(--mut)]">
        <Icon className="size-4 shrink-0 text-[var(--mut)]" />
        <span>{label}</span>
      </span>
      <span className="min-w-0 truncate text-xs sm:text-sm font-bold text-[var(--tx)]">
        {value}
      </span>
    </div>
  );
}

function CopyableValue({ value, mono }: { value: string; mono?: boolean }) {
  const t = useTranslations('dashboard.common');
  const [copied, setCopied] = useState(false);
  const display =
    mono && value.startsWith('0x')
      ? `${value.slice(0, 6)}...${value.slice(-4)}`
      : value.length > 18
        ? `${value.slice(0, 8)}...${value.slice(-4)}`
        : value;

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--s1)] px-2.5 py-1 text-xs font-bold text-[var(--tx)] transition-colors hover:border-[#7A12F5]/50 cursor-pointer',
        mono && 'font-mono tabular-nums',
      )}
      title={t('copy')}
      aria-label={t('copyValue', { value })}
    >
      {copied ? (
        <Check className="size-3.5 text-[#2FBD8E]" />
      ) : (
        <Copy className="size-3.5 text-[var(--mut)]" />
      )}
      <span>{display}</span>
    </button>
  );
}

function SkeletonCard() {
  return (
    <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 space-y-4">
      <div className="h-5 w-1/3 animate-pulse rounded-lg bg-[var(--s2)]" />
      <div className="h-11 w-full animate-pulse rounded-xl bg-[var(--s2)]" />
      <div className="h-11 w-full animate-pulse rounded-xl bg-[var(--s2)]" />
    </section>
  );
}

function GuestCard() {
  const t = useTranslations('dashboard.settings');
  return (
    <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 space-y-4">
      <div className="flex items-center gap-3">
        <UserCircle className="size-6 text-[var(--mut)]" />
        <div>
          <h2 className="text-base font-extrabold text-[var(--tx)]">{t('notSignedInTitle')}</h2>
          <p className="text-xs sm:text-sm text-[var(--mut)] mt-0.5">{t('notSignedInDesc')}</p>
        </div>
      </div>
      <div>
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[#7A12F5] px-5 text-xs sm:text-sm font-extrabold text-white shadow-sm hover:bg-[#8C38F7] transition-all"
        >
          {t('signInCta')}
        </Link>
      </div>
    </section>
  );
}

