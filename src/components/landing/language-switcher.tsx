'use client';

/**
 * landing/language-switcher.tsx — compact locale picker.
 *
 * A globe icon + the current locale code that opens a dropdown of every
 * supported language. Switching navigates to the SAME path under the new
 * locale (preserving the current route) using next-intl's locale-aware
 * router. Uses a cookie via the router so the choice persists across visits.
 *
 * Placed in the nav (desktop bar + mobile panel) and the footer.
 *
 * Stable Animation During Development Hot Reload (AGENTS.md rule):
 *   This component holds only ephemeral open/closed UI state (a boolean). It
 *   contains no animation state, so HMR re-renders don't reset anything.
 */
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  zh: '🇨🇳',
  es: '🇪🇸',
  pt: '🇵🇹',
  ru: '🇷🇺',
  vi: '🇻🇳',
  id: '🇮🇩',
  tr: '🇹🇷',
  fr: '🇫🇷',
};

export function LanguageSwitcher() {
  const t = useTranslations('languageSwitcher');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function selectLocale(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    // Navigate to the same pathname under the new locale. next-intl's router
    // handles the prefix swap and sets the NEXT_LOCALE cookie so the choice
    // persists.
    router.replace(pathname, { locale: next });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('current', { name: t(`languages.${locale}`) })}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-9 md:h-10 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--s2)] px-3 md:px-3.5 text-xs md:text-[13px] font-bold text-[var(--tx)] transition-all hover:bg-[var(--s1)] active:scale-[0.98] cursor-pointer"
      >
        <span className="max-w-[96px] sm:max-w-none truncate">{t(`languages.${locale}`)}</span>
        <span className="text-sm leading-none shrink-0" aria-hidden="true">
          {LOCALE_FLAGS[locale]}
        </span>
        <ChevronDown className={cn('size-3 text-[var(--mut)] shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('label')}
          className="absolute right-0 z-50 mt-2 min-w-[11.5rem] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-1.5 text-[var(--tx)] shadow-2xl backdrop-blur-xl"
        >
          {routing.locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => selectLocale(l)}
                className={cn(
                  'flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--s2)] text-[var(--tx)] cursor-pointer',
                  l === locale && 'font-bold text-[var(--pri)] bg-[var(--s2)]/60',
                )}
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <span className="truncate">{t(`languages.${l}`)}</span>
                  <span className="text-base leading-none shrink-0" aria-hidden="true">
                    {LOCALE_FLAGS[l]}
                  </span>
                </span>
                {l === locale && <Check className="size-3.5 shrink-0 text-[var(--pri)]" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
