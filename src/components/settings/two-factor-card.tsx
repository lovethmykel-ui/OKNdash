'use client';

/**
 * components/settings/two-factor-card.tsx
 *
 * Shared TOTP two-factor auth card. Used by BOTH the user settings page
 * (/app/settings) and the admin profile page (/admin/profile).
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Copy, KeyRound, Loader2, Shield, ShieldAlert, ShieldCheck, Smartphone } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSetup2fa, useEnable2fa, useDisable2fa } from '@/lib/hooks/use-2fa';
import { toastError } from '@/lib/api/toast';
import type { MeUser } from '@/lib/api/client';

export interface TwoFactorCardProps {
  user: MeUser | null;
  isLoading: boolean;
  showGuest?: boolean;
}

export function TwoFactorCard({ user, isLoading, showGuest }: TwoFactorCardProps) {
  const t = useTranslations('dashboard.settings');
  const tToast = useTranslations('toasts.settings');
  const { toast } = useToast();
  const setup = useSetup2fa();
  const enable = useEnable2fa();
  const disable = useDisable2fa();
  const [stage, setStage] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  if (isLoading) {
    return (
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 space-y-4">
        <div className="h-5 w-48 animate-pulse rounded-lg bg-[var(--s2)]" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--s2)]" />
        <div className="h-10 w-36 animate-pulse rounded-xl bg-[var(--s2)]" />
      </section>
    );
  }

  if (showGuest || !user) {
    return (
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#7A12F5]/15 text-[#C9A6FF]">
            <Shield className="size-5" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">{t('twoFactorTitle')}</h2>
            <p className="text-xs sm:text-sm text-[var(--mut)] mt-0.5">{t('notSignedInDesc')}</p>
          </div>
        </div>
      </section>
    );
  }

  const startSetup = () => {
    setCode('');
    setStage('setup');
    setup.mutate(undefined, {
      onSuccess: () => {},
      onError: (err) =>
        toastError(err, 'Could not start two-factor setup.', tToast('verificationFailed')),
    });
  };

  const handleEnable = (e: React.FormEvent) => {
    e.preventDefault();
    enable.mutate(code.trim(), {
      onSuccess: (res) => {
        setBackupCodes(res.backupCodes);
        setStage('idle');
        setCode('');
        toast({ title: t('twoFactorEnabledTitle'), description: t('twoFactorEnabledDesc') });
      },
      onError: (err) =>
        toastError(err, 'Could not enable two-factor authentication.', tToast('verificationFailed')),
    });
  };

  const handleDisable = (e: React.FormEvent) => {
    e.preventDefault();
    disable.mutate(code.trim(), {
      onSuccess: () => {
        setStage('idle');
        setCode('');
        toast({ title: t('twoFactorDisabledTitle') });
      },
      onError: (err) =>
        toastError(err, 'Could not disable two-factor authentication.', tToast('verificationFailed')),
    });
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret).then(() => {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 1600);
    });
  };

  const enabled = user.twoFactorEnabled;

  return (
    <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-5">
      {/* Section Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--line)]">
        <div className="flex items-start gap-3.5 min-w-0">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border ${
              enabled
                ? 'border-[#2FBD8E]/35 bg-[#2FBD8E]/15 text-[#2FBD8E]'
                : 'border-[#7A12F5]/35 bg-[#7A12F5]/15 text-[#C9A6FF]'
            }`}
          >
            {enabled ? <ShieldCheck className="size-5 stroke-[2.2]" /> : <Shield className="size-5 stroke-[2.2]" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
                {t('twoFactorTitle')}
              </h2>
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold ${
                  enabled ? 'text-[#2FBD8E]' : 'text-[var(--mut)]'
                }`}
              >
                <span>·</span>
                <span>{enabled ? t('verified') : 'Inactive'}</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-[var(--mut)] leading-relaxed">
              {t('twoFactorDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {enabled ? (
          stage === 'disable' ? (
            <form onSubmit={handleDisable} className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 sm:p-5 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="disable-code" className="block text-xs sm:text-sm font-bold text-[var(--tx)]">
                  {t('enterCode')}
                </label>
                <input
                  id="disable-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="h-11 w-full max-w-xs rounded-xl border border-[var(--line)] bg-[var(--s1)] px-4 font-mono text-lg font-bold tracking-[0.35em] text-[var(--tx)] outline-none focus:border-[#7A12F5] transition-colors tabular-nums"
                  placeholder={t('codePlaceholder')}
                  required
                />
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="submit"
                  disabled={code.length !== 6 || disable.isPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#EF4444] px-4 text-xs sm:text-sm font-extrabold text-white shadow-sm hover:bg-[#DC2626] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {disable.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  <span>{t('twoFactorDisable')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStage('idle')}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s1)] px-4 text-xs sm:text-sm font-bold text-[var(--tx)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#2FBD8E]/30 bg-[#2FBD8E]/8 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="size-5 text-[#2FBD8E] shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-medium text-[var(--tx)] leading-relaxed">
                  {t('twoFactorOnDesc')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCode('');
                  setStage('disable');
                }}
                className="shrink-0 inline-flex h-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s1)] px-4 text-xs sm:text-sm font-bold text-[var(--tx)] hover:bg-[var(--s2)] transition-colors cursor-pointer whitespace-nowrap"
              >
                {t('twoFactorDisable')}
              </button>
            </div>
          )
        ) : stage === 'setup' ? (
          setup.isPending ? (
            <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 text-xs sm:text-sm font-semibold text-[var(--mut)]">
              <Loader2 className="size-4 animate-spin text-[#7A12F5]" />
              <span>{t('twoFactorPreparing')}</span>
            </div>
          ) : setup.data ? (
            <form onSubmit={handleEnable} className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 sm:p-5 space-y-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="rounded-2xl border border-[var(--line)] bg-white p-2.5 shrink-0 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={setup.data.qrDataUrl}
                    alt="Authenticator QR code"
                    width={148}
                    height={148}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2.5 text-xs sm:text-sm min-w-0 flex-1">
                  <p className="font-semibold text-[var(--tx)] leading-relaxed">{t('twoFactorScanHint')}</p>
                  <p className="text-[var(--mut)]">{t('twoFactorManualHint')}</p>
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--s1)] px-3 py-2">
                    <KeyRound className="size-4 text-[#C9A6FF] shrink-0" />
                    <code className="flex-1 truncate font-mono text-xs font-bold text-[var(--tx)]">
                      {setup.data.secret}
                    </code>
                    <button
                      type="button"
                      onClick={() => copySecret(setup.data.secret)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[var(--s2)] px-2 py-1 text-[11px] font-bold text-[var(--tx)] hover:bg-[var(--line)] transition-colors cursor-pointer shrink-0"
                    >
                      {copiedSecret ? <Check className="size-3 text-[#2FBD8E]" /> : <Copy className="size-3" />}
                      <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[var(--line)]">
                <label htmlFor="enable-code" className="block text-xs sm:text-sm font-bold text-[var(--tx)]">
                  {t('enterCode')}
                </label>
                <input
                  id="enable-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="h-11 w-full max-w-xs rounded-xl border border-[var(--line)] bg-[var(--s1)] px-4 font-mono text-lg font-bold tracking-[0.35em] text-[var(--tx)] outline-none focus:border-[#7A12F5] transition-colors tabular-nums"
                  placeholder={t('codePlaceholder')}
                  required
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="submit"
                  disabled={code.length !== 6 || enable.isPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7A12F5] px-5 text-xs sm:text-sm font-extrabold text-white shadow-sm hover:bg-[#8C38F7] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {enable.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  <span>{t('twoFactorEnable')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStage('idle')}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s1)] px-4 text-xs sm:text-sm font-bold text-[var(--tx)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          ) : null
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="size-5 text-[#C9A6FF] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-[var(--tx)]">
                  Authenticator App (TOTP)
                </p>
                <p className="text-xs text-[var(--mut)] leading-relaxed">
                  {t('twoFactorOffDesc')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={startSetup}
              className="shrink-0 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7A12F5] px-4 text-xs sm:text-sm font-extrabold text-white shadow-sm shadow-[#7A12F5]/25 hover:bg-[#8C38F7] transition-all cursor-pointer whitespace-nowrap"
            >
              <Shield className="size-4" />
              <span>{t('twoFactorEnable')}</span>
            </button>
          </div>
        )}

        {/* Backup codes shown once after enabling */}
        {backupCodes ? (
          <div className="rounded-2xl border border-[#F59E0B]/35 bg-[#F59E0B]/10 p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-[#F59E0B] shrink-0" />
              <p className="text-xs sm:text-sm font-extrabold text-[var(--tx)]">{t('backupCodesTitle')}</p>
            </div>
            <p className="text-xs text-[var(--mut)] leading-relaxed">{t('backupCodesDesc')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-[var(--line)] bg-[var(--s1)] p-3 font-mono text-xs font-bold text-[var(--tx)] tabular-nums">
              {backupCodes.map((c) => (
                <span key={c} className="px-2 py-1 rounded bg-[var(--s2)] text-center">
                  {c}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setBackupCodes(null)}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s1)] px-4 text-xs font-bold text-[var(--tx)] hover:bg-[var(--s2)] transition-colors cursor-pointer"
            >
              {t('backupCodesDone')}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

