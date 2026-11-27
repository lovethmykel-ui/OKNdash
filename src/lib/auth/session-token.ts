import crypto from 'node:crypto';
import type { AdminRole } from './permissions';

export const SESSION_COOKIE_NAME = 'okn_session';
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
 * Returns the HMAC signing secret from SESSION_SECRET, or an ephemeral runtime
 * CSPRNG secret cached in process memory for local/preview environments.
 * Never falls back to a hardcoded string literal.
 */
export function getSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  if (configured && configured.length >= 16) {
    return configured;
  }
  if (!globalForSecret.__oknEphemeralSessionSecret) {
    globalForSecret.__oknEphemeralSessionSecret = crypto
      .randomBytes(32)
      .toString('hex');
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

/**
 * Checks basic CSRF protection on cookie-mutating auth endpoints:
 * requires either a matching Origin header or our custom X-Requested-With header.
 */
export function isTrustedAuthRequest(headers: Headers): boolean {
  const requestedWith = headers.get('x-requested-with');
  if (requestedWith !== 'OKN-Auth') {
    return false;
  }

  const origin = headers.get('origin');
  if (!origin) {
    return true;
  }

  const expectedHost =
    headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    headers.get('host')?.trim();

  if (!expectedHost) {
    return false;
  }

  try {
    return new URL(origin).host === expectedHost;
  } catch {
    return false;
  }
}

/**
 * Builds an iframe-compatible HttpOnly Set-Cookie header string.
 * Uses SameSite=None; Secure; Partitioned so cookies work inside cross-origin
 * preview iframes as well as localhost (which Chromium treats as secure).
 */
export function buildSessionSetCookieHeader(
  token: string,
  maxAgeSeconds = SESSION_MAX_AGE_SECONDS,
): string {
  return [
    `${SESSION_COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    'SameSite=None',
    'Secure',
    'Partitioned',
  ].join('; ');
}
