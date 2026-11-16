import Image from 'next/image';
import { getLocaleFlag } from '@/lib/i18n/flags';
import { cn } from '@/lib/utils';

interface LocaleFlagProps {
  locale: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { width: 18, height: 13, className: 'w-[18px] h-[13px] rounded-[3px]' },
  md: { width: 22, height: 16, className: 'w-[22px] h-[16px] rounded-[4px]' },
  lg: { width: 26, height: 19, className: 'w-[26px] h-[19px] rounded-[5px]' },
} as const;

export function LocaleFlag({ locale, size = 'md', className }: LocaleFlagProps) {
  const flag = getLocaleFlag(locale);
  const dims = SIZE_MAP[size];

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden shadow-2xs ring-1 ring-black/12 dark:ring-white/15',
        dims.className,
        className,
      )}
      aria-hidden="true"
    >
      <Image
        src={flag.src}
        alt=""
        width={dims.width}
        height={dims.height}
        referrerPolicy="no-referrer"
        className="size-full object-cover"
      />
    </span>
  );
}
