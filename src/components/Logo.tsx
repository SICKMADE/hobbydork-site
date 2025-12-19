import Image from 'next/image';

import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  iconOnly?: boolean;
  abbreviated?: boolean;
};

export default function Logo({ className, iconOnly = false, abbreviated = false }: LogoProps) {
  // NOTE: Main brand logo lives at /public/hobbydork-main.png
  // (full wordmark). iconOnly uses /public/hobbydork-head.png.
  const fullLogoSrc = '/hobbydork-main.png';
  const headLogoSrc = '/hobbydork-head.png';

  // Keep existing prop surface area; abbreviated currently maps to iconOnly.
  const showIconOnly = iconOnly || abbreviated;

  return (
    <div className={cn('flex items-center', className)}>
      {showIconOnly ? (
        <Image
          src={headLogoSrc}
          alt="HobbyDork"
          width={48}
          height={48}
          className="h-12 w-12 object-contain"
          priority
        />
      ) : (
        <Image
          src={fullLogoSrc}
          alt="HobbyDork"
          width={260}
          height={72}
          className="h-12 w-auto object-contain"
          priority
        />
      )}
    </div>
  );
}
