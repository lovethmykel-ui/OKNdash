/**
 * lib/auth/guard.ts — Server-Verified Dashboard Auth Guard
 * Reads and cryptographically verifies the signed `okn_session` cookie on every
 * protected Server Component render, redirecting unauthenticated users to /login.
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AdminRole } from './permissions';
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type AuthProvider,
} from './session-token';

export { isAuthBypassed } from './bypass';

export interface DemoSession {
  sub: string;
  provider?: AuthProvider;
  telegramId: string | null;
  walletAddress: string | null;
  adminRole: AdminRole | null;
}

export const DEMO_SESSION: DemoSession = {
  sub: '00000000-0000-0000-0000-000000000000',
  provider: 'telegram',
  telegramId: '1234567890',
  walletAddress: '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377',
  adminRole: 'super_admin',
};

export async function getVerifiedSession(): Promise<DemoSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const verified = verifySessionToken(token);
  if (!verified) return null;

  return {
    sub: verified.sub,
    provider: verified.provider,
    telegramId: verified.telegramId,
    walletAddress: verified.walletAddress,
    adminRole: verified.adminRole,
  };
}

export async function requireUser(): Promise<DemoSession> {
  const session = await getVerifiedSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireAdmin(): Promise<DemoSession> {
  const session = await requireUser();
  if (!session.adminRole) {
    redirect('/login');
  }
  return session;
}
