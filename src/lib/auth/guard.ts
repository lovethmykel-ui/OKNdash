/**
 * lib/auth/guard.ts — Standalone Demo Dashboard Guard
 * Provides deterministic demo session for user and admin routes without backend cookies.
 */
import type { AdminRole } from './permissions';

export { isAuthBypassed } from './bypass';

export interface DemoSession {
  sub: string;
  telegramId: string | null;
  walletAddress: string | null;
  adminRole: AdminRole | null;
}

export const DEMO_SESSION: DemoSession = {
  sub: '00000000-0000-0000-0000-000000000000',
  telegramId: '1234567890',
  walletAddress: '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377',
  adminRole: 'super_admin',
};

export async function requireUser(): Promise<DemoSession> {
  return DEMO_SESSION;
}

export async function requireAdmin(): Promise<DemoSession> {
  return DEMO_SESSION;
}
