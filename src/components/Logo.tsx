
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  iconOnly?: boolean;
  abbreviated?: boolean;
};

const LegoHead = ({ className }: { className?: string }) => (
    <svg
      className={cn("h-8 w-8 text-primary", className)}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Skull */}
      <g fill="white">
        <rect x="35" y="5" width="30" height="10" rx="2" />
        <ellipse cx="50" cy="5" rx="15" ry="4" />
        <rect x="20" y="15" width="60" height="55" rx="5" />
        <circle cx="38" cy="38" r="5" fill="hsl(var(--background))" />
        <circle cx="62" cy="38" r="5" fill="hsl(var(--background))" />
        <path d="M35 55 Q50 65 65 55" stroke="hsl(var(--background))" fill="none" />
      </g>
      {/* Crossbones Underneath */}
      <g transform="translate(0, 65)" fill="white">
        <rect x="10" y="15" width="80" height="10" rx="5" transform="rotate(-20 50 20)" />
        <rect x="10" y="15" width="80" height="10" rx="5" transform="rotate(20 50 20)" />
      </g>
    </svg>
);


export default function Logo({ className, iconOnly = false, abbreviated = false }: LogoProps) {
  const textToShow = abbreviated ? "HD" : "HobbyDork";

  return (
    <div className={cn('flex items-center justify-center gap-4 text-primary', className)}>
      <LegoHead className="h-12 w-12" />
      {!iconOnly && (
          <h1 
            className="text-4xl font-nintendo font-black tracking-tight italic"
            style={{
                color: 'hsl(var(--destructive))',
                textShadow: 
                  '1px 1px 0 #fff, -1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff, 3px 3px 5px rgba(0,0,0,0.5)'
            }}
            >
            <span>{textToShow}</span>
          </h1>
      )}
    </div>
  );
}
