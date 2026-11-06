/**
 * lib/auth/bypass.ts — Standalone Demo Dashboard Auth Bypass
 * Always enabled so the interactive demo runs without any environment variables.
 */
export function isAuthBypassed(): boolean {
  return true;
}

export function hasProductionSecret(): boolean {
  return false;
}

export function assertNoDangerousBypassInProduction(): void {
  // No-op for interactive demo
}
