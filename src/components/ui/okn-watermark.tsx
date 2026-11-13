'use client';

import { cn } from '@/lib/utils';

interface OknWatermarkProps {
  /**
   * 'hero' | 'white'  -> vivid gradient cards (crisp white brand mark watermark)
   * 'card' | 'tinted' -> surface/card backgrounds (white in dark mode, subtle monochrome in light mode)
   * 'inverse'         -> inverted cards (white on dark surface in light mode, dark on white surface in dark mode)
   */
  variant?: 'hero' | 'white' | 'card' | 'tinted' | 'inverse';
  /**
   * 'sm' -> compact horizontal banners / CTAs
   * 'md' -> standard feature & hero cards
   * 'lg' -> tall full-width hero / coming-soon canvases
   */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<OknWatermarkProps['size']>, string> = {
  sm: '-right-6 sm:-right-4 h-[155%] min-h-[210px] sm:min-h-[250px]',
  md: '-right-8 sm:-right-6 h-[145%] min-h-[270px] sm:min-h-[340px] md:min-h-[380px]',
  lg: '-right-10 sm:-right-8 h-[135%] min-h-[320px] sm:min-h-[400px] md:min-h-[460px]',
};

/**
 * Large, angled OKN geometric logo watermark positioned on the right edge
 * of hero and feature cards.
 */
export function OknWatermark({
  variant = 'hero',
  size = 'md',
  className,
}: OknWatermarkProps) {
  const toneClass =
    variant === 'hero' || variant === 'white'
      ? 'brightness-0 invert opacity-[0.18]'
      : variant === 'inverse'
        ? 'brightness-0 invert opacity-[0.12] dark:invert-0 dark:opacity-[0.065]'
        : 'brightness-0 opacity-[0.055] dark:invert dark:opacity-[0.095]';

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute top-1/2 -translate-y-1/2 aspect-square select-none overflow-visible z-0 flex items-center justify-center',
        SIZE_CLASSES[size],
        className,
      )}
    >
      <div className="relative flex size-full items-center justify-center -rotate-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/okn-logo.png"
          alt=""
          className={cn('size-full object-contain', toneClass)}
        />
      </div>
    </div>
  );
}

