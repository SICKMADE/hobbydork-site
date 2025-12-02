
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
            {/* Lego Head */}
            <rect x="35" y="5" width="30" height="10" rx="2" />
            <ellipse cx="50" cy="5" rx="15" ry="4" />
            <rect x="20" y="15" width="60" height="55" rx="5" />
            <circle cx="38" cy="38" r="5" fill="hsl(var(--background))" />
            <circle cx="62" cy="38" r="5" fill="hsl(var(--background))" />
            <path d="M35 55 Q50 65 65 55" stroke="hsl(var(--background))" strokeWidth="3" fill="none" />

            {/* Crossbones */}
            <g transform="translate(0, 65) scale(0.9)">
                <g transform="rotate(-30 50 25)">
                    <path d="M 15 25 C 15 15, 25 15, 25 25 S 15 35, 15 25 Z" />
                    <path d="M 25 25 C 25 15, 35 15, 35 25 S 25 35, 25 35 Z" transform="translate(40, 0) scale(-1, 1) translate(-60, 0)" />
                    <rect x="22" y="22.5" width="56" height="5" rx="2.5" />
                    <path d="M 75 25 C 75 15, 85 15, 85 25 S 75 35, 75 25 Z" />
                    <path d="M 85 25 C 85 15, 95 15, 95 25 S 85 35, 85 35 Z" transform="translate(140, 0) scale(-1, 1) translate(-180, 0)" />
                </g>
                <g transform="rotate(30 50 25)">
                    <path d="M 15 25 C 15 15, 25 15, 25 25 S 15 35, 15 25 Z" />
                    <path d="M 25 25 C 25 15, 35 15, 35 25 S 25 35, 25 35 Z" transform="translate(40, 0) scale(-1, 1) translate(-60, 0)" />
                    <rect x="22" y="22.5" width="56" height="5" rx="2.5" />
                    <path d="M 75 25 C 75 15, 85 15, 85 25 S 75 35, 75 25 Z" />
                    <path d="M 85 25 C 85 15, 95 15, 95 25 S 85 35, 85 35 Z" transform="translate(140, 0) scale(-1, 1) translate(-180, 0)" />
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
