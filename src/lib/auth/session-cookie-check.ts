/**
 * Edge-safe structural & expiry check for the `okn_session_v2` cookie.
 * Used in Next.js Middleware (Edge Runtime) to redirect unauthenticated visitors
 * immediately, while full HMAC-SHA256 verification runs in Node Server Components
 * and Route Handlers (`verifySessionToken`).
 */
export const SESSION_COOKIE_NAME = 'okn_session_v2';
export const LEGACY_SESSION_COOKIE_NAME = 'okn_session';

function decodeBase64UrlToUtf8(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    const binary = atob(`${normalized}${pad}`);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function hasPlausibleSessionCookie(
  token: string | undefined | null,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature || signature.length < 32) return false;

  const decoded = decodeBase64UrlToUtf8(encodedPayload);
  if (!decoded) return false;

  try {
    const parsed = JSON.parse(decoded) as {
      sub?: unknown;
      provider?: unknown;
      exp?: unknown;
    };
    if (
      typeof parsed.sub !== 'string' ||
      (parsed.provider !== 'telegram' && parsed.provider !== 'wallet') ||
      typeof parsed.exp !== 'number'
    ) {
      return false;
    }
    return parsed.exp > nowSeconds;
  } catch {
    return false;
  }
}

/**
 * Checks all matching cookies (protecting against duplicate partitioned vs
 * unpartitioned cookies in the same browser jar).
 */
export function hasAnyPlausibleSessionCookie(
  tokens: readonly (string | undefined | null)[],
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  return tokens.some((token) => hasPlausibleSessionCookie(token, nowSeconds));
}
