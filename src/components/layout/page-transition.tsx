'use client';

/**
 * components/layout/page-transition.tsx — Phase 7.6
 *
 * Wraps page content in a deterministic CSS enter transition keyed by pathname.
 * Used inside template.tsx files (one per route group that needs transitions).
 *
 * Using pure CSS keyframes avoids Framer Motion SSR/client style attribute
 * divergence while honoring prefers-reduced-motion in globals.css.
 */
import { usePathname } from '@/i18n/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="okn-page-enter">
      {children}
    </div>
  );
}

