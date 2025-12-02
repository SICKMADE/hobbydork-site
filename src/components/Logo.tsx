
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  iconOnly?: boolean;
};

const LegoHead = ({ className }: { className?: string }) => (
    <svg
      className={cn("h-8 w-8 text-primary", className)}
      viewBox="0 0 100 125"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
        <g>
            {/* Crossbones */}
            <g transform="translate(5, 60) scale(0.9)">
                <path transform="rotate(-30 50 25)" d="M20,15 C10,15 10,35 20,35 L80,35 C90,35 90,15 80,15 L20,15 Z M15,10 C5,10 5,40 15,40 M85,10 C95,10 95,40 85,40" fill="currentColor" />
                <path transform="rotate(30 50 25)" d="M20,15 C10,15 10,35 20,35 L80,35 C90,35 90,15 80,15 L20,15 Z M15,10 C5,10 5,40 15,40 M85,10 C95,10 95,40 85,40" fill="currentColor" />
            </g>

            {/* Top Cylinder */}
            <rect x="35" y="5" width="30" height="10" rx="2" />
            <ellipse cx="50" cy="5" rx="15" ry="4" />
            
            {/* Head */}
            <rect x="20" y="15" width="60" height="55" rx="5" />

            {/* Face - Simple Eyes and Smile */}
            <circle cx="38" cy="38" r="5" fill="hsl(var(--background))" />
            <circle cx="62" cy="38" r="5" fill="hsl(var(--background))" />
            <path d="M35 55 Q50 65 65 55" stroke="hsl(var(--background))" strokeWidth="3" fill="none" />
        </g>
    </svg>
);


export default function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2 text-primary', className)}>
      <LegoHead className="h-10 w-10" />
      {!iconOnly && (
        <h1 className="text-xl font-bold tracking-tighter text-foreground">
          <span>HobbyDork</span>
        </h1>
      )}
    </div>
  );
}
