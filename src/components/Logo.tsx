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
        <g transform="translate(0, 5)">
            {/* Top Cylinder */}
            <rect x="35" y="10" width="30" height="10" rx="2" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="2" />
            <ellipse cx="50" cy="10" rx="15" ry="5" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="2" />
            
            {/* Head */}
            <rect x="20" y="20" width="60" height="60" rx="5" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="2" />

            {/* Face - Simple Eyes and Smile */}
            <circle cx="38" cy="45" r="5" fill="hsl(var(--background))" />
            <circle cx="62" cy="45" r="5" fill="hsl(var(--background))" />
            <path d="M35 65 Q50 75 65 65" stroke="hsl(var(--background))" strokeWidth="3" fill="none" />

            {/* Crossbones */}
            <g transform="translate(5, 75)" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="2">
                <g transform="rotate(15 50 50)">
                    <rect x="10" y="20" width="70" height="12" rx="6"/>
                    <circle cx="10" cy="18" r="7" />
                    <circle cx="80" cy="28" r="7" />
                </g>
                 <g transform="rotate(-15 50 50)">
                    <rect x="10" y="20" width="70" height="12" rx="6"/>
                    <circle cx="10" cy="28" r="7" />
                    <circle cx="80" cy="18" r="7" />
                </g>
            </g>
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
