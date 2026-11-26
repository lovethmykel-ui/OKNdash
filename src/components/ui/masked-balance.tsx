'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import { cn } from '@/lib/utils';

interface MaskedBalanceProps {
  hidden: boolean;
  mask?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Smoothly cross-fades between a revealed balance value and its masked dots
 * with zero layout jump and hydration-safe reduced-motion handling.
 */
export function MaskedBalance({
  hidden,
  mask = '••••••',
  children,
  className,
}: MaskedBalanceProps) {
  const hydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const reduceMotion = hydrated && Boolean(prefersReduced);

  return (
    <span className={cn('inline-block align-baseline', className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={hidden ? 'masked' : 'visible'}
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 2, filter: 'blur(3px)' }
          }
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0, filter: 'blur(0px)' }
          }
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -2, filter: 'blur(3px)' }
          }
          transition={{ duration: reduceMotion ? 0.1 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {hidden ? mask : children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

interface EyeToggleIconProps {
  hidden: boolean;
  className?: string;
}

/**
 * Matching subtle fade transition for the Eye / EyeOff icon inside hide-balance buttons.
 */
export function EyeToggleIcon({ hidden, className = 'size-3.5' }: EyeToggleIconProps) {
  const hydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const reduceMotion = hydrated && Boolean(prefersReduced);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={hidden ? 'off' : 'on'}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="inline-flex items-center justify-center"
      >
        {hidden ? <EyeOff className={className} /> : <Eye className={className} />}
      </motion.span>
    </AnimatePresence>
  );
}
