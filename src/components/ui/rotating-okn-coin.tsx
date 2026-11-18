'use client';

import type { CSSProperties } from 'react';
import Image from 'next/image';
import coinAsset from '../../../public/brand/OKN_coin_transparent_padded.png';
import { cn } from '@/lib/utils';

interface RotatingOknCoinProps {
  size?: number;
  className?: string;
  durationSec?: number;
}

/**
 * Displays the 3D $OKN coin PNG asset with a continuous bouncing animation
 * and a reactive floor shadow (SSR-safe via CSS keyframes, zero hydration mismatch).
 */
export function RotatingOknCoin({
  size = 52,
  className,
  durationSec = 2.2,
}: RotatingOknCoinProps) {
  const durationStyle = {
    width: size,
    height: size,
    '--okn-coin-duration': `${durationSec}s`,
  } as CSSProperties;

  return (
    <div
      style={durationStyle}
      className={cn(
        'relative shrink-0 select-none pointer-events-none flex items-center justify-center',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="okn-coin-shadow absolute -bottom-1 h-2 w-[66%] rounded-full bg-[#7A12F5]/40 blur-[4px] dark:bg-[#09B4FF]/35"
      />
      <div
        style={{ width: size, height: size }}
        className="okn-coin-bounce relative drop-shadow-[0_6px_14px_rgba(122,18,245,0.28)]"
      >
        <Image
          src={coinAsset}
          alt="$OKN 3D Coin"
          width={size}
          height={size}
          priority
          referrerPolicy="no-referrer"
          className="size-full object-contain"
        />
      </div>
    </div>
  );
}
