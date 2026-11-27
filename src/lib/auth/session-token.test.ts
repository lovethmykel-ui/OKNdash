import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSessionPayload,
  signSessionToken,
  verifySessionToken,
  verifyAnySessionToken,
  validateLoginPayload,
  isTrustedAuthRequest,
  isTrustedFormOrigin,
  resolveSafeRedirectPath,
  buildSessionSetCookieHeader,
  getSessionSecret,
  SESSION_COOKIE_NAME,
} from './session-token';
import {
  hasPlausibleSessionCookie,
  hasAnyPlausibleSessionCookie,
} from './session-cookie-check';

const TEST_SECRET = 'test-signing-secret-with-at-least-32-chars-0123456789';

test('getSessionSecret produces identical deterministic key across isolated serverless instances', () => {
  const g = globalThis as typeof globalThis & { __oknEphemeralSessionSecret?: string };
  delete g.__oknEphemeralSessionSecret;
  const secretInstanceA = getSessionSecret();

  // Simulate a separate Vercel serverless function cold start with cleared global memory
  delete g.__oknEphemeralSessionSecret;
  const secretInstanceB = getSessionSecret();

  assert.equal(secretInstanceA, secretInstanceB);
  assert.ok(secretInstanceA.length >= 32);
});

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

test('verifyAnySessionToken and hasAnyPlausibleSessionCookie recover from stale duplicate cookies', () => {
  const now = 1_800_000_000;
  const validPayload = createSessionPayload('telegram', now);
  const validToken = signSessionToken(validPayload, TEST_SECRET);
  const staleToken = signSessionToken(validPayload, 'old-stale-secret-from-prior-deploy-999999');

  const verified = verifyAnySessionToken([staleToken, 'garbage', validToken], TEST_SECRET, now + 5);
  assert.ok(verified);
  assert.equal(verified.provider, 'telegram');

  assert.equal(hasAnyPlausibleSessionCookie(['invalid', validToken], now + 5), true);
  assert.equal(hasAnyPlausibleSessionCookie(['invalid', ''], now + 5), false);
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

test('isTrustedFormOrigin validates native form POST origin and rejects cross-site requests', () => {
  assert.equal(
    isTrustedFormOrigin(
      new Headers({
        origin: 'https://okndash.vercel.app',
        'x-forwarded-host': 'okndash.vercel.app',
        'sec-fetch-site': 'same-origin',
      }),
    ),
    true,
  );

  assert.equal(
    isTrustedFormOrigin(
      new Headers({
        referer: 'https://okndash.vercel.app/login',
        host: 'okndash.vercel.app',
      }),
    ),
    true,
  );

  assert.equal(
    isTrustedFormOrigin(
      new Headers({
        origin: 'https://evil.example.org',
        host: 'okndash.vercel.app',
        'sec-fetch-site': 'cross-site',
      }),
    ),
    false,
  );
});

test('resolveSafeRedirectPath blocks open redirects and keeps relative paths', () => {
  assert.equal(resolveSafeRedirectPath('/app/portfolio'), '/app/portfolio');
  assert.equal(resolveSafeRedirectPath('/es/app/portfolio'), '/es/app/portfolio');
  assert.equal(resolveSafeRedirectPath('https://evil.com'), '/app/portfolio');
  assert.equal(resolveSafeRedirectPath('//evil.com/phish'), '/app/portfolio');
  assert.equal(resolveSafeRedirectPath('/\\evil.com'), '/app/portfolio');
});

test('buildSessionSetCookieHeader sets HttpOnly, SameSite=None, Secure, and Partitioned by default and supports SameSite=Lax', () => {
  const header = buildSessionSetCookieHeader('abc.def', 3600);
  assert.match(header, new RegExp(`^${SESSION_COOKIE_NAME}=abc\\.def`));
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=None/);
  assert.match(header, /Secure/);
  assert.match(header, /Partitioned/);
  assert.match(header, /Max-Age=3600/);

  const laxHeader = buildSessionSetCookieHeader('abc.def', 3600, {
    sameSite: 'lax',
    secure: true,
  });
  assert.match(laxHeader, /SameSite=Lax/);
  assert.match(laxHeader, /Secure/);
  assert.doesNotMatch(laxHeader, /Partitioned/);
});

