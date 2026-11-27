/**
 * lib/auth/bypass.ts — Auth Bypass Configuration
 * Disabled so dashboard routes enforce server-verified session cookies.
 */
export function isAuthBypassed(): boolean {
  return false;
}

export function hasProductionSecret(): boolean {
  return Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16);
}

export function assertNoDangerousBypassInProduction(): void {
  // Auth bypass is disabled.
}
