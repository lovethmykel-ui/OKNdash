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
import { LocaleFlag } from '@/components/ui/locale-flag';
import { cn } from '@/lib/utils';

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
    router.replace(pathname, { locale: next });
  }

  return (
    <div ref={ref} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('current', { name: t(`languages.${locale}`) })}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-9 md:h-10 items-center justify-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--s2)] px-2.5 md:px-3 text-xs md:text-[13px] font-bold text-[var(--tx)] transition-all hover:bg-[var(--s1)] active:scale-[0.98] cursor-pointer shadow-2xs"
      >
        <LocaleFlag locale={locale} size="md" />
        <ChevronDown
          className={cn(
            'size-3.5 text-[var(--mut)] shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          data-testid="language-switcher-menu"
          className="absolute right-0 top-full z-[200] mt-2 w-56 overflow-hidden rounded-2xl border border-[#E2DDEE] dark:border-[#26262D] bg-white dark:bg-[#131316] p-1.5 text-[#15121F] dark:text-[#F5F5F7] shadow-[0_20px_50px_rgba(12,10,24,0.24)]"
        >
          <div className="px-3 py-1.5 border-b border-[#E2DDEE] dark:border-[#26262D] mb-1 flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5C5870] dark:text-[#A3A3AF]">
              {t('label')}
            </span>
            <LocaleFlag locale={locale} size="sm" />
          </div>
          <ul role="listbox" aria-label={t('label')} className="space-y-0.5">
            {routing.locales.map((l) => {
              const isSelected = l === locale;
              return (
                <li key={l}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectLocale(l)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-[13px] transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-[#7A12F5]/12 font-extrabold text-[#7A12F5] dark:text-[#C9A6FF]'
                        : 'font-semibold text-[#15121F] dark:text-[#F5F5F7] hover:bg-[#EFEBF8] dark:hover:bg-[#1B1B20]',
                    )}
                  >
                    <span className="truncate">{t(`languages.${l}`)}</span>
                    <span className="ml-auto inline-flex items-center gap-2 shrink-0">
                      {isSelected && (
                        <Check className="size-3.5 stroke-[2.6] text-[#7A12F5] dark:text-[#C9A6FF]" />
                      )}
                      <LocaleFlag locale={l} size="md" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
