/**
 * lib/domains.ts — Single-origin demo domain helpers (zero external env vars required).
 */

export function isSubdomainSplitActive(): boolean {
  return false;
}

export function isOnAppSubdomain(): boolean {
  return false;
}

export function bareAppHref(href: string): string {
  return href;
}

export function appOrigin(): string {
  return '';
}

export function adminOrigin(): string {
  return '';
}

export function apexOrigin(): string {
  return '';
}

export function loginUrl(next?: string, locale?: string): string {
  const prefix = !locale || locale === 'en' ? '' : `/${locale}`;
  const base = `${prefix}/login`;
  if (!next) return base;
  return `${base}?next=${encodeURIComponent(next)}`;
}

export function deriveRootDomain(_appUrl: string | undefined): string | undefined {
  return undefined;
}
