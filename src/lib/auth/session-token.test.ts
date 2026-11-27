import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSessionPayload,
  signSessionToken,
  verifySessionToken,
  validateLoginPayload,
  isTrustedAuthRequest,
  buildSessionSetCookieHeader,
  SESSION_COOKIE_NAME,
} from './session-token';
import { hasPlausibleSessionCookie } from './session-cookie-check';

const TEST_SECRET = 'test-signing-secret-with-at-least-32-chars-0123456789';

test('signSessionToken and verifySessionToken round-trip for telegram and wallet', () => {
  const now = 1_800_000_000;
  const tgPayload = createSessionPayload('telegram', now);
  const tgToken = signSessionToken(tgPayload, TEST_SECRET);
  const verifiedTg = verifySessionToken(tgToken, TEST_SECRET, now + 10);

  assert.ok(verifiedTg);
  assert.equal(verifiedTg.provider, 'telegram');
  assert.equal(verifiedTg.sub, tgPayload.sub);
  assert.equal(verifiedTg.telegramId, '1234567890');

  const walletPayload = createSessionPayload('wallet', now);
  const walletToken = signSessionToken(walletPayload, TEST_SECRET);
  const verifiedWallet = verifySessionToken(walletToken, TEST_SECRET, now + 10);

  assert.ok(verifiedWallet);
  assert.equal(verifiedWallet.provider, 'wallet');
  assert.equal(verifiedWallet.sub, walletPayload.sub);
  assert.equal(verifiedWallet.telegramId, null);
  assert.ok(verifiedWallet.walletAddress);
});

test('verifySessionToken rejects tampered, wrong-secret, malformed, and expired tokens', () => {
  const now = 1_800_000_000;
  const payload = createSessionPayload('telegram', now);
  const token = signSessionToken(payload, TEST_SECRET);

  // Wrong secret
  assert.equal(verifySessionToken(token, 'another-completely-different-secret-99999', now + 5), null);

  // Tampered payload
  const [encodedPayload, sig] = token.split('.');
  const tamperedPayload = Buffer.from(
    JSON.stringify({ ...payload, provider: 'wallet' }),
  ).toString('base64url');
  assert.equal(verifySessionToken(`${tamperedPayload}.${sig}`, TEST_SECRET, now + 5), null);

  // Tampered signature
  const flippedSig = `${sig.slice(0, -1)}${sig.endsWith('A') ? 'B' : 'A'}`;
  assert.equal(verifySessionToken(`${encodedPayload}.${flippedSig}`, TEST_SECRET, now + 5), null);

  // Expired token
  assert.equal(verifySessionToken(token, TEST_SECRET, payload.exp + 1), null);

  // Malformed tokens
  assert.equal(verifySessionToken('', TEST_SECRET, now), null);
  assert.equal(verifySessionToken('not-a-valid-token', TEST_SECRET, now), null);
  assert.equal(verifySessionToken('a.b.c', TEST_SECRET, now), null);
});

test('hasPlausibleSessionCookie validates token structure and expiry for Edge middleware', () => {
  const now = 1_800_000_000;
  const payload = createSessionPayload('telegram', now);
  const token = signSessionToken(payload, TEST_SECRET);

  assert.equal(hasPlausibleSessionCookie(token, now + 60), true);
  assert.equal(hasPlausibleSessionCookie(token, payload.exp + 10), false);
  assert.equal(hasPlausibleSessionCookie(undefined, now), false);
  assert.equal(hasPlausibleSessionCookie('invalid', now), false);
});

test('validateLoginPayload enforces wallet existing-accounts-only notice acceptance', () => {
  assert.deepEqual(validateLoginPayload({ provider: 'telegram' }), {
    ok: true,
    provider: 'telegram',
    acceptedExistingAccountNotice: false,
  });

  const missingAcceptance = validateLoginPayload({ provider: 'wallet' });
  assert.equal(missingAcceptance.ok, false);
  assert.equal(missingAcceptance.status, 400);

  const falseAcceptance = validateLoginPayload({
    provider: 'wallet',
    acceptedExistingAccountNotice: false,
  });
  assert.equal(falseAcceptance.ok, false);

  assert.deepEqual(
    validateLoginPayload({
      provider: 'wallet',
      acceptedExistingAccountNotice: true,
    }),
    {
      ok: true,
      provider: 'wallet',
      acceptedExistingAccountNotice: true,
    },
  );

  assert.equal(validateLoginPayload({ provider: 'qr' }).ok, false);
  assert.equal(validateLoginPayload(null).ok, false);
});

test('isTrustedAuthRequest requires custom header and matching origin', () => {
  const validHeaders = new Headers({
    'x-requested-with': 'OKN-Auth',
    origin: 'https://preview.example.com',
    'x-forwarded-host': 'preview.example.com',
  });
  assert.equal(isTrustedAuthRequest(validHeaders), true);

  const missingHeader = new Headers({
    origin: 'https://preview.example.com',
    host: 'preview.example.com',
  });
  assert.equal(isTrustedAuthRequest(missingHeader), false);

  const crossOrigin = new Headers({
    'x-requested-with': 'OKN-Auth',
    origin: 'https://evil.example.org',
    host: 'preview.example.com',
  });
  assert.equal(isTrustedAuthRequest(crossOrigin), false);
});

test('buildSessionSetCookieHeader sets HttpOnly, SameSite=None, Secure, and Partitioned', () => {
  const header = buildSessionSetCookieHeader('abc.def', 3600);
  assert.match(header, new RegExp(`^${SESSION_COOKIE_NAME}=abc\\.def`));
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=None/);
  assert.match(header, /Secure/);
  assert.match(header, /Partitioned/);
  assert.match(header, /Max-Age=3600/);
});
