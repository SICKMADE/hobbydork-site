
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  iconOnly?: boolean;
};

const LegoHead = ({ className }: { className?: string }) => (
    <svg
      className={cn("h-8 w-8 text-primary", className)}
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simplified Crossbones - Background */}
      <g transform="translate(5, 5) scale(0.9)">
        <rect x="10" y="45" width="80" height="10" rx="5" transform="rotate(-45 50 50)" />
        <circle cx="15" cy="15" r="8" transform="rotate(-45 50 50)"/>
        <circle cx="85" cy="85" r="8" transform="rotate(-45 50 50)"/>
        <rect x="10" y="45" width="80" height="10" rx="5" transform="rotate(45 50 50)" />
        <circle cx="85" cy="15" r="8" transform="rotate(45 50 50)"/>
        <circle cx="15" cy="85" r="8" transform="rotate(45 50 50)"/>
      </g>
      
      {/* Skull */}
      <g>
        <rect x="35" y="5" width="30" height="10" rx="2" />
        <ellipse cx="50" cy="5" rx="15" ry="4" />
        <rect x="20" y="15" width="60" height="55" rx="5" />
        <circle cx="38" cy="38" r="5" fill="hsl(var(--background))" />
        <circle cx="62" cy="38" r="5" fill="hsl(var(--background))" />
        <path d="M35 55 Q50 65 65 55" stroke="hsl(var(--background))" strokeWidth="3" fill="none" />
      </g>
    </svg>
);


export default function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 text-primary w-full', className)}>
      <LegoHead className="h-10 w-10" />
      {!iconOnly && (
        <h1 className="text-xl font-bold tracking-tighter text-foreground">
          <span>HobbyDork</span>
        </h1>
      )}
    </div>
  );
}
