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
      <g>
        {/* Top Cylinder */}
        <path d="M40,15 C40,10 60,10 60,15 L60,25 C60,30 40,30 40,25 Z" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="2"/>
        <ellipse cx="50" cy="15" rx="10" ry="5" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="2" />
        
        {/* Head */}
        <path d="M20,30 C20,20 80,20 80,30 L85,80 C85,95 15,95 15,80 Z" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="2"/>
        
        {/* Face - Simple Glasses and Smile */}
        <circle cx="38" cy="55" r="8" stroke="hsl(var(--background))" strokeWidth="2.5" fill="none"/>
        <circle cx="62" cy="55" r="8" stroke="hsl(var(--background))" strokeWidth="2.5" fill="none"/>
        <line x1="46" y1="55" x2="54" y2="55" stroke="hsl(var(--background))" strokeWidth="2.5" />
        <path d="M40 75 Q50 85 60 75" stroke="hsl(var(--background))" strokeWidth="2.5" fill="none" />
      </g>
    </svg>
);


export default function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2 text-primary', className)}>
      <LegoHead className="h-10 w-10" />
      {!iconOnly && (
        <h1 className="text-xl font-bold tracking-tighter">
          <span className="text-foreground">VaultVerse</span>
        </h1>
      )}
    </div>
  );
}
