import { Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  iconOnly?: boolean;
};

export default function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2 text-primary', className)}>
      <Rocket className="h-6 w-6" />
      {!iconOnly && (
        <h1 className="text-xl font-bold tracking-tighter">
          HobbyDork <span className="text-foreground/80">VaultVerse</span>
        </h1>
      )}
    </div>
  );
}
