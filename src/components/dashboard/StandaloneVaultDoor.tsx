'use client';

// --- Inlined `cn` utility to remove external dependency ---
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// --- End of inlined utility ---

import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { handleVaultPinCheck } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, X } from 'lucide-react';
import React from 'react';


// --- Inlined SVG Icons to reduce dependencies ---
const AwardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" ry="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const HobbyDorkLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#FFDDBB" stroke="#000000" strokeWidth="3">
      <rect x="35" y="5" width="30" height="10" rx="5" ry="5" />
      <rect x="10" y="15" width="80" height="80" rx="15" ry="15" />
      <circle cx="35" cy="50" r="4" fill="black" stroke="none" />
      <circle cx="65" cy="50" r="4" fill="black" stroke="none" />
      <rect x="25" y="40" width="20" height="20" rx="2" ry="2" fill="none" stroke="black" strokeWidth="2.5" />
      <rect x="55" y="40" width="20" height="20" rx="2" ry="2" fill="none" stroke="black" strokeWidth="2.5" />
      <line x1="45" y1="50" x2="55" y2="50" stroke="black" strokeWidth="2.5" />
      <path d="M 42 82 Q 50 82 58 79" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);


// --- Inlined UI Component Pieces ---
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg", className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const Button = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link' }
>(({ className, variant, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    const variantClasses = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
    };
    return <button className={cn(baseClasses, variant ? variantClasses[variant] : variantClasses.default, className)} ref={ref} {...props} />;
});
Button.displayName = 'Button';


// --- Self-Contained Vault Door ---
function SafeDoorIcon() {
  return (
    <div className="relative w-64 h-48 flex items-center justify-center cursor-pointer group">
      <div className="absolute w-full h-full rounded-lg bg-gradient-to-br from-neutral-600 to-neutral-800 shadow-lg" />
      <div className="absolute w-[95%] h-[90%] rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800 shadow-inner" />
      <div className="absolute w-[85%] h-[80%] rounded-lg bg-gradient-to-b from-neutral-600 to-neutral-700 border-4 border-neutral-800" />
      <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900 border-4 border-neutral-900 shadow-2xl transition-transform duration-300 group-hover:rotate-45">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-2.5 bg-neutral-600 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-2.5 bg-neutral-600 rounded-full rotate-90" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-2 border-neutral-700" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-neutral-500 to-neutral-700 shadow-inner" />
      </div>
      <div className="absolute -bottom-2 -right-2 w-16 h-12 bg-neutral-900 rounded-lg p-2 grid grid-cols-2 gap-1 border-2 border-neutral-950 shadow-lg">
          <div className="w-full h-full bg-neutral-700/50 rounded-sm" />
          <div className="w-full h-full bg-neutral-700/50 rounded-sm" />
          <div className="w-full h-full bg-neutral-700/50 rounded-sm" />
          <div className="w-full h-full bg-red-500/70 rounded-sm animate-pulse" />
      </div>
      <div className="absolute left-[-16px] top-[40px] w-6 h-16 bg-neutral-800 rounded-md border-t-2 border-b-2 border-neutral-900 shadow-md" />
      <div className="absolute left-[-16px] bottom-[40px] w-6 h-16 bg-neutral-800 rounded-md border-t-2 border-b-2 border-neutral-900 shadow-md" />
    </div>
  );
}

export function StandaloneVaultDoor() {
  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  const handlePinClick = (digit: string) => {
    if (pin.length < 4) setPin(pin + digit);
  };
  const handleClear = () => { setPin(''); setReason(''); };
  const handleBackspace = () => setPin(pin.slice(0, -1));

  async function checkPin() {
    if (pin.length !== 4) return;
    setIsSubmitting(true);
    try {
      const result = await handleVaultPinCheck({ pin });
      if (result.isCorrect) {
        setIsCorrect(true);
        setReason(result.reason);
      } else {
        setReason(result.reason);
        toast({ title: 'Incorrect PIN', description: result.reason, variant: 'destructive' });
        handleClear();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to communicate with the vault system.', variant: 'destructive' });
      handleClear();
    } finally {
      setIsSubmitting(false);
    }
  }

  const resetVault = () => {
    setIsOpen(false);
    setIsCorrect(false);
    setPin('');
    setReason('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open ? resetVault() : setIsOpen(true)}>
      <DialogTrigger asChild>
        <button className="bg-card p-8 rounded-lg flex flex-col items-center gap-4 text-center" aria-label="Open Vault" title="Open Vault">
          <h3 className="text-2xl font-bold"></h3>
          <p className="max-w-md text-muted-foreground"></p>
          <SafeDoorIcon />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <div className="sr-only">
            <DialogTitle>{isCorrect ? "Vault Unlocked" : "Unlock the Vault"}</DialogTitle>
            <DialogDescription>
            {isCorrect
                ? "You have successfully unlocked the vault. Claim your prize."
                : "Enter the 4-digit PIN to unlock the vault and win a prize."}
            </DialogDescription>
        </div>

        {isCorrect ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AwardIcon className="w-16 h-16 text-yellow-400 animate-bounce" />
            <h2 className="mt-4 font-headline text-2xl font-bold">Congratulations, You Won!</h2>
            <p className="mt-2 text-muted-foreground">{reason}</p>
            <a href="mailto:winner@example.com?subject=I%20unlocked%20the%20HOBBYDORK%20vault!" className="mt-6">
                <Button>
                    <MailIcon className="mr-2 h-4 w-4"/>
                    Claim Your Prize
                </Button>
            </a>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1.5">
                <h2 className="text-lg font-semibold leading-none tracking-tight font-headline">Enter PIN</h2>
                <p className="text-sm text-muted-foreground">Enter the 4-digit PIN to unlock the vault.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-48 rounded-md bg-input flex items-center justify-center">
                <p className="font-mono text-3xl tracking-widest">{pin.padEnd(4, '•')}</p>
              </div>
               {reason && <p className="text-destructive text-sm font-medium">{reason}</p>}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'Clear', 0, 'Del'].map((item) => (
                  <Button
                    key={item}
                    variant="outline"
                    className="w-16 h-16 text-2xl font-bold"
                    onClick={() => {
                      if (typeof item === 'number') handlePinClick(item.toString());
                      else if (item === 'Clear') handleClear();
                      else if (item === 'Del') handleBackspace();
                    }}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
              <Button type="button" className="w-full" disabled={isSubmitting || pin.length !== 4} onClick={checkPin}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                <span>Unlock</span>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
