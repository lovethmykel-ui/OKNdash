import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { routing } from '@/i18n/routing';
import { getAllLocaleFlags, getLocaleFlag, LOCALE_FLAG_MAP } from './flags';

test('every configured locale has a valid SVG flag file in public/flags', () => {
  const all = getAllLocaleFlags();
  assert.equal(all.length, routing.locales.length);

  for (const locale of routing.locales) {
    const meta = LOCALE_FLAG_MAP[locale];
    assert.ok(meta, `missing flag metadata for locale ${locale}`);
    assert.match(meta.src, /^\/flags\/[a-z]{2}\.svg$/);
    const diskPath = path.join(process.cwd(), 'public', meta.src.replace(/^\//, ''));
    assert.ok(fs.existsSync(diskPath), `missing SVG file at ${diskPath}`);
    const svg = fs.readFileSync(diskPath, 'utf8');
    assert.ok(svg.includes('<svg') && svg.includes('</svg>'), `invalid SVG content in ${diskPath}`);
  }
});

test('getLocaleFlag falls back cleanly to default locale for unknown values', () => {
  assert.equal(getLocaleFlag('fr').countryCode, 'FR');
  assert.equal(getLocaleFlag('unknown').locale, routing.defaultLocale);
  assert.equal(getLocaleFlag(undefined).locale, routing.defaultLocale);
});
