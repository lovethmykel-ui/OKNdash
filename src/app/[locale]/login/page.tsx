import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getVerifiedSession } from '@/lib/auth/guard';
import { OknLoginView } from '@/components/auth/okn-login-view';

export const metadata: Metadata = {
  title: 'Sign in to $OKN | OKNexus Ecosystem',
  description:
    'Sign in to $OKN with Telegram or connect your existing Web3 wallet to access your OKNexus dashboard.',
};

export default async function LoginPage() {
  const session = await getVerifiedSession();
  if (session) {
    redirect('/app/portfolio');
  }

  return <OknLoginView />;
}
