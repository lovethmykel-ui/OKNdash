'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import coinAsset from '../../../public/brand/OKN_coin_transparent_padded.png';
import { cn } from '@/lib/utils';

interface RotatingOknCoinProps {
  size?: number;
  className?: string;
  durationSec?: number;
}

/**
 * Displays the 3D $OKN coin PNG asset with a continuous slow 3D rotation.
 */
export function RotatingOknCoin({
  size = 52,
  className,
  durationSec = 9,
}: RotatingOknCoinProps) {
  const prefersReduced = useReducedMotion();
  const disableMotion = prefersReduced === true;

  return (
    <div
      style={{ width: size, height: size, perspective: 640 }}
      className={cn(
        'relative shrink-0 select-none pointer-events-none flex items-center justify-center',
        className,
      )}
    >
      <motion.div
        initial={{ rotate: 0, rotateY: -12 }}
        animate={
          disableMotion
            ? { rotate: 0, rotateY: 0 }
            : {
                rotate: [0, 360],
                rotateY: [-14, 14, -14],
              }
        }
        transition={
          disableMotion
            ? undefined
            : {
                rotate: {
                  duration: durationSec,
                  repeat: Infinity,
                  ease: 'linear',
                },
                rotateY: {
                  duration: durationSec * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }
        }
        style={{
          width: size,
          height: size,
          transformStyle: 'preserve-3d',
        }}
        className="drop-shadow-[0_6px_14px_rgba(122,18,245,0.28)]"
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
      </motion.div>
    </div>
  );
}
