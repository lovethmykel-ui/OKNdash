'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import {
  resolveShareCardVariant,
  type ShareCardOverride,
  type ShareCardVariant,
} from '@/lib/share-card';
import {
  OPEN_SHARE_CARD_EVENT,
  ShareCardModal,
  type OpenShareCardDetail,
} from './share-card-modal';

const MOBILE_BREAKPOINT_PX = 768;
const SCREENSHOT_COOLDOWN_MS = 15_000;
const MIN_CAPTURE_BOUNCE_MS = 50;
const MAX_CAPTURE_BOUNCE_MS = 1500;

/**
 * Global host that listens for:
 *  1. Direct 1-tap share card button triggers (`okn:open-share-card`).
 *  2. Keyboard screenshot shortcuts (`PrintScreen`, `Cmd+Shift+3/4/5`).
 *  3. Best-effort mobile OS screenshot bounce heuristics (rapid blur->focus or
 *     hidden->visible flicker under 1.5s on mobile screens while viewing
 *     Portfolio, Referrals, or Profile).
 */
export function ScreenshotShareListener() {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const routeVariant = resolveShareCardVariant(pathname);

  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<ShareCardVariant>('portfolio');
  const [source, setSource] = useState<'button' | 'screenshot'>('button');
  const [override, setOverride] = useState<ShareCardOverride | null>(null);

  const lastAutoTriggerRef = useRef<number>(0);
  const blurTimestampRef = useRef<number | null>(null);
  const hiddenTimestampRef = useRef<number | null>(null);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Listen for programmatic / button-triggered share card requests
  useEffect(() => {
    if (!hydrated) return;

    const handleOpenEvent = (ev: Event) => {
      const detail = (ev as CustomEvent<OpenShareCardDetail>).detail;
      const targetVariant = detail?.variant ?? routeVariant ?? 'portfolio';
      setVariant(targetVariant);
      setSource(detail?.source ?? 'button');
      setOverride(detail?.override ?? null);
      setOpen(true);
    };

    window.addEventListener(OPEN_SHARE_CARD_EVENT, handleOpenEvent);
    return () => {
      window.removeEventListener(OPEN_SHARE_CARD_EVENT, handleOpenEvent);
    };
  }, [hydrated, routeVariant]);

  // Listen for screenshot gestures on shareable screens (Portfolio / Referrals / Profile)
  useEffect(() => {
    if (!hydrated || !routeVariant) return;

    const triggerFromScreenshot = () => {
      if (openRef.current) return;
      const now = Date.now();
      if (now - lastAutoTriggerRef.current < SCREENSHOT_COOLDOWN_MS) return;
      lastAutoTriggerRef.current = now;
      setVariant(routeVariant);
      setSource('screenshot');
      setOverride(null);
      setOpen(true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        triggerFromScreenshot();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // macOS screenshot shortcuts (Cmd+Shift+3/4/5)
      if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
        triggerFromScreenshot();
      }
    };

    // Mobile OS hardware screenshot heuristic (iOS/Android screenshot preview overlay causes brief focus/visibility bounce)
    const handleBlur = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT_PX) return;
      blurTimestampRef.current = Date.now();
    };

    const handleFocus = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT_PX) return;
      const startedAt = blurTimestampRef.current;
      blurTimestampRef.current = null;
      if (!startedAt) return;
      const elapsed = Date.now() - startedAt;
      if (elapsed >= MIN_CAPTURE_BOUNCE_MS && elapsed <= MAX_CAPTURE_BOUNCE_MS) {
        triggerFromScreenshot();
      }
    };

    const handleVisibilityChange = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT_PX) return;
      if (document.visibilityState === 'hidden') {
        hiddenTimestampRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const startedAt = hiddenTimestampRef.current;
        hiddenTimestampRef.current = null;
        if (!startedAt) return;
        const elapsed = Date.now() - startedAt;
        if (elapsed >= MIN_CAPTURE_BOUNCE_MS && elapsed <= MAX_CAPTURE_BOUNCE_MS) {
          triggerFromScreenshot();
        }
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hydrated, routeVariant]);

  if (!hydrated) return null;

  return (
    <ShareCardModal
      open={open}
      initialVariant={variant}
      triggerSource={source}
      initialOverride={override}
      onClose={() => setOpen(false)}
    />
  );
}
