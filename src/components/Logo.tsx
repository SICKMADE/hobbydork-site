
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
            <g transform="translate(0, 55)">
              <g transform="rotate(-30 50 25)">
                <rect x="20" y="22.5" width="60" height="5" rx="2.5" />
                <circle cx="20" cy="20" r="7" />
                <circle cx="20" cy="30" r="7" />
                <circle cx="80" cy="20" r="7" />
                <circle cx="80"cy="30" r="7" />
              </g>
              <g transform="rotate(30 50 25)">
                <rect x="20" y="22.5" width="60" height="5" rx="2.5" />
                <circle cx="20" cy="20" r="7" />
                <circle cx="20" cy="30" r="7" />
                <circle cx="80" cy="20" r="7" />
                <circle cx="80" cy="30" r="7" />
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
