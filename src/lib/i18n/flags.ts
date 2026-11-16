import { routing, type Locale } from '@/i18n/routing';

export interface LocaleFlagMeta {
  locale: Locale;
  countryCode: string;
  src: string;
  emoji: string;
  nativeLabel: string;
}

export const LOCALE_FLAG_MAP: Record<Locale, LocaleFlagMeta> = {
  en: {
    locale: 'en',
    countryCode: 'GB',
    src: '/flags/gb.svg',
    emoji: '🇬🇧',
    nativeLabel: 'English',
  },
  zh: {
    locale: 'zh',
    countryCode: 'CN',
    src: '/flags/cn.svg',
    emoji: '🇨🇳',
    nativeLabel: '中文',
  },
  es: {
    locale: 'es',
    countryCode: 'ES',
    src: '/flags/es.svg',
    emoji: '🇪🇸',
    nativeLabel: 'Español',
  },
  pt: {
    locale: 'pt',
    countryCode: 'PT',
    src: '/flags/pt.svg',
    emoji: '🇵🇹',
    nativeLabel: 'Português',
  },
  ru: {
    locale: 'ru',
    countryCode: 'RU',
    src: '/flags/ru.svg',
    emoji: '🇷🇺',
    nativeLabel: 'Русский',
  },
  vi: {
    locale: 'vi',
    countryCode: 'VN',
    src: '/flags/vn.svg',
    emoji: '🇻🇳',
    nativeLabel: 'Tiếng Việt',
  },
  id: {
    locale: 'id',
    countryCode: 'ID',
    src: '/flags/id.svg',
    emoji: '🇮🇩',
    nativeLabel: 'Bahasa Indonesia',
  },
  tr: {
    locale: 'tr',
    countryCode: 'TR',
    src: '/flags/tr.svg',
    emoji: '🇹🇷',
    nativeLabel: 'Türkçe',
  },
  fr: {
    locale: 'fr',
    countryCode: 'FR',
    src: '/flags/fr.svg',
    emoji: '🇫🇷',
    nativeLabel: 'Français',
  },
};

export function getLocaleFlag(locale: string | undefined): LocaleFlagMeta {
  if (locale && locale in LOCALE_FLAG_MAP) {
    return LOCALE_FLAG_MAP[locale as Locale];
  }
  return LOCALE_FLAG_MAP[routing.defaultLocale];
}

export function getAllLocaleFlags(): LocaleFlagMeta[] {
  return routing.locales.map((locale) => LOCALE_FLAG_MAP[locale]);
}
