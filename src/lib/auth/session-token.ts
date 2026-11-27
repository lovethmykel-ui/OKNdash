import crypto from 'node:crypto';
import type { AdminRole } from './permissions';

export const SESSION_COOKIE_NAME = 'okn_session_v2';
export const LEGACY_SESSION_COOKIE_NAME = 'okn_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type AuthProvider = 'telegram' | 'wallet';

export interface SessionPayload {
  sub: string;
  provider: AuthProvider;
  telegramId: string | null;
  walletAddress: string | null;
  adminRole: AdminRole | null;
  iat: number;
  exp: number;
}

export type LoginValidationResult =
  | {
      ok: true;
      provider: AuthProvider;
      acceptedExistingAccountNotice: boolean;
    }
  | {
      ok: false;
      error: string;
      status: number;
    };

const globalForSecret = globalThis as typeof globalThis & {
  __oknEphemeralSessionSecret?: string;
};

/**
 * Returns a deterministic deployment-scoped SHA-256 HMAC signing secret so all
 * serverless function instances (e.g., on Vercel) verify cookies signed by
 * `/api/auth/session` without requiring manual environment variable setup.
 */
export function getSessionSecret(): string {
  if (!globalForSecret.__oknEphemeralSessionSecret) {
    const deploymentSeed = [
      process.env.VERCEL_PROJECT_ID,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
      process.env.APP_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NODE_ENV,
      'oknexus-session-hmac-v2',
    ]
      .filter(Boolean)
      .join(':');
    globalForSecret.__oknEphemeralSessionSecret = crypto
      .createHash('sha256')
      .update(deploymentSeed)
      .digest('hex');
  }
  return globalForSecret.__oknEphemeralSessionSecret;
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function computeHmac(encodedPayload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');
}

/**
 * Builds a deterministic demo session payload for an authenticated OKN user.
 */
export function createSessionPayload(
  provider: AuthProvider,
  nowSeconds = Math.floor(Date.now() / 1000),
): SessionPayload {
  return {
    sub:
      provider === 'telegram'
        ? '00000000-0000-0000-0000-000000000001'
        : '00000000-0000-0000-0000-000000000002',
    provider,
    telegramId: provider === 'telegram' ? '1234567890' : null,
    walletAddress:
      provider === 'wallet'
        ? '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377'
        : '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377',
    adminRole: 'super_admin',
    iat: nowSeconds,
    exp: nowSeconds + SESSION_MAX_AGE_SECONDS,
  };
}

/**
 * Signs a session payload into a compact `<base64url-json>.<base64url-hmac>` token.
 */
export function signSessionToken(
  payload: SessionPayload,
  secret = getSessionSecret(),
): string {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = computeHmac(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

/**
 * Cryptographically verifies a signed session token using constant-time comparison
 * and validates payload structure and expiration.
 */
export function verifySessionToken(
  token: string | undefined | null,
  secret = getSessionSecret(),
  nowSeconds = Math.floor(Date.now() / 1000),
): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, providedSig] = parts;
  if (!encodedPayload || !providedSig) return null;

  const expectedSig = computeHmac(encodedPayload, secret);
  const providedBuf = Buffer.from(providedSig);
  const expectedBuf = Buffer.from(expectedSig);

  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<SessionPayload>;
    if (
      typeof parsed.sub !== 'string' ||
      (parsed.provider !== 'telegram' && parsed.provider !== 'wallet') ||
      typeof parsed.iat !== 'number' ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }

    if (parsed.exp <= nowSeconds) {
      return null;
    }

    return {
      sub: parsed.sub,
      provider: parsed.provider,
      telegramId: typeof parsed.telegramId === 'string' ? parsed.telegramId : null,
      walletAddress: typeof parsed.walletAddress === 'string' ? parsed.walletAddress : null,
      adminRole: parsed.adminRole ?? null,
      iat: parsed.iat,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Verifies a list of candidate cookie values (e.g., from `cookies.getAll`) and
 * returns the first valid, unexpired session payload. Prevents stale duplicate
 * cookies from blocking a freshly issued session.
 */
export function verifyAnySessionToken(
  tokens: readonly (string | undefined | null)[],
  secret = getSessionSecret(),
  nowSeconds = Math.floor(Date.now() / 1000),
): SessionPayload | null {
  for (const token of tokens) {
    const verified = verifySessionToken(token, secret, nowSeconds);
    if (verified) return verified;
  }
  return null;
}

/**
 * Validates the POST /api/auth/session request body.
 * Strictly requires explicit acceptance of the existing-accounts-only notice
 * whenever signing in with a Web3 wallet.
 */
export function validateLoginPayload(body: unknown): LoginValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      ok: false,
      error: 'Invalid sign-in request payload.',
      status: 400,
    };
  }

  const record = body as Record<string, unknown>;
  const provider = record.provider;

  if (provider !== 'telegram' && provider !== 'wallet') {
    return {
      ok: false,
      error: 'Unsupported sign-in provider. Use Telegram or Wallet.',
      status: 400,
    };
  }

  const acceptedExistingAccountNotice = record.acceptedExistingAccountNotice === true;

  if (provider === 'wallet' && !acceptedExistingAccountNotice) {
    return {
      ok: false,
      error:
        'You must accept the existing-accounts-only notice before continuing with Wallet sign-in.',
      status: 400,
    };
  }

  return {
    ok: true,
    provider,
    acceptedExistingAccountNotice,
  };
}

function matchesRequestHost(urlHeader: string, headers: Headers): boolean {
  const forwardedHost = headers
    .get('x-forwarded-host')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  const host = headers.get('host')?.trim().toLowerCase();

  if (!forwardedHost && !host) {
    return false;
  }

  try {
    const parsedHost = new URL(urlHeader).host.toLowerCase();
    return parsedHost === forwardedHost || parsedHost === host;
  } catch {
    return false;
  }
}

/**
 * Checks CSRF protection on JSON/XHR cookie-mutating auth endpoints:
 * requires our custom X-Requested-With header and, when an Origin header is
 * present, verifies it matches either X-Forwarded-Host or Host.
 */
export function isTrustedAuthRequest(headers: Headers): boolean {
  const requestedWith = headers.get('x-requested-with');
  if (requestedWith !== 'OKN-Auth') {
    return false;
  }

  const origin = headers.get('origin');
  if (!origin || origin === 'null') {
    return true;
  }

  return matchesRequestHost(origin, headers);
}

/**
 * Checks CSRF protection for native HTML `<form method="POST">` top-level login
 * submissions (which do not send custom headers like `X-Requested-With`).
 * Verifies Origin or Referer matches Host / X-Forwarded-Host and rejects
 * cross-site Sec-Fetch-Site forged posts.
 */
export function isTrustedFormOrigin(headers: Headers): boolean {
  const secFetchSite = headers.get('sec-fetch-site')?.trim().toLowerCase();
  if (secFetchSite === 'cross-site') {
    return false;
  }

  const origin = headers.get('origin');
  if (origin && origin !== 'null') {
    return matchesRequestHost(origin, headers);
  }

  const referer = headers.get('referer');
  if (referer) {
    return matchesRequestHost(referer, headers);
  }

  // Fallback for privacy-stripped Referer/Origin on same-origin navigations
  return secFetchSite === 'same-origin' || secFetchSite === 'same-site' || secFetchSite === 'none';
}

/**
 * Ensures post-login redirect targets are strictly relative same-origin paths
 * (preventing open redirect attacks).
 */
export function resolveSafeRedirectPath(
  raw: unknown,
  fallback = '/app/portfolio',
): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    /[\r\n\0]/.test(trimmed)
  ) {
    return fallback;
  }
  return trimmed;
}

export interface SessionCookieOptions {
  sameSite?: 'none' | 'lax';
  secure?: boolean;
}

/**
 * Builds an HttpOnly Set-Cookie header string.
 * - Defaults to `SameSite=None; Secure; Partitioned` for cross-origin preview iframes.
 * - Supports `SameSite=Lax` for top-level deployments (e.g., Vercel on iOS Safari/Chrome).
 */
export function buildSessionSetCookieHeader(
  token: string,
  maxAgeSeconds = SESSION_MAX_AGE_SECONDS,
  options?: SessionCookieOptions,
  cookieName = SESSION_COOKIE_NAME,
): string {
  const sameSite = options?.sameSite ?? 'none';
  const secure = options?.secure ?? true;

  const parts = [
    `${cookieName}=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (sameSite === 'lax') {
    parts.push('SameSite=Lax');
    if (secure) {
      parts.push('Secure');
    }
  } else {
    parts.push('SameSite=None', 'Secure', 'Partitioned');
  }

  return parts.join('; ');
}
