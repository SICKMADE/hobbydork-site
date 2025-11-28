'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useVault } from '@/lib/vault';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Mail, KeyRound, Sparkles } from 'lucide-react';
import Confetti from 'react-confetti';

interface VaultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VaultModal({ open, onOpenChange }: VaultModalProps) {
  const { pin, isPinRevealed, isVaultUnlocked, unlockVault } = useVault();
  const [enteredPin, setEnteredPin] = useState('');
  const { toast } = useToast();

  const handleUnlock = () => {
    if (unlockVault(enteredPin)) {
      // The state will change to isVaultUnlocked, and the component will re-render
    } else {
      toast({
        title: 'Incorrect PIN',
        description: 'The vault remains sealed. Try again.',
        variant: 'destructive',
      });
      setEnteredPin('');
    }
  };

  const PinReveal = () => (
    <>
     <Confetti recycle={false} numberOfPieces={200} />
      <DialogHeader>
        <DialogTitle className="flex items-center justify-center text-2xl gap-2">
          <Sparkles className="text-primary" />
          SECRET UNLOCKED!
          <Sparkles className="text-primary" />
          </DialogTitle>
        <DialogDescription className="text-center">
          You've found a hidden secret. A vault door will appear on your dashboard.
        </DialogDescription>
      </DialogHeader>
      <div className="my-4 text-center">
        <p className="text-muted-foreground">Use this PIN to open it:</p>
        <p className="text-4xl font-bold tracking-widest text-primary py-4 bg-primary/10 rounded-lg my-2">
          {pin}
        </p>
      </div>
      <Button onClick={() => onOpenChange(false)} className="w-full">
        Got It
      </Button>
    </>
  );

  const PinEntry = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center justify-center text-2xl gap-2">
            <KeyRound className="text-primary"/> The Vault
        </DialogTitle>
        <DialogDescription className="text-center">
          Enter the 4-digit PIN to claim your reward.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <Input
          type="text"
          maxLength={4}
          value={enteredPin}
          onChange={(e) => setEnteredPin(e.target.value)}
          className="text-center text-2xl tracking-[1em]"
          placeholder="----"
        />
        <Button onClick={handleUnlock} disabled={enteredPin.length !== 4}>
          Unlock
        </Button>
      </div>
    </>
  );

  const UnlockedMessage = () => (
    <div className="text-center py-8">
      <Mail className="h-16 w-16 mx-auto text-primary animate-bounce" />
      <h2 className="text-2xl font-bold mt-4">Vault Opened!</h2>
      <p className="text-muted-foreground mt-2">You've got mail! A special reward has been sent to your inbox.</p>
       <Button onClick={() => onOpenChange(false)} className="w-full mt-6">
        Awesome!
      </Button>
    </div>
  );

  const renderContent = () => {
    if (isVaultUnlocked) {
      return <UnlockedMessage />;
    }
    // The modal is opened from two places. If it's opened from the search bar, isPinRevealed is true and we show the PIN.
    // If it's opened from the vault button, isPinRevealed is also true, but we should show the entry form.
    // A simple way to distinguish is if the vault is already unlocked.
    // Let's refine the logic: we need to know WHY the modal is open.
    // A better way: when search bar opens it, it's for reveal. When dashboard button opens it, it's for entry.
    // The current props don't distinguish. I'll use `isPinRevealed` to mean "show reveal message", then on close, it's done.
    // So the state machine is: `isPinRevealed` is fresh, `isVaultUnlocked` is false -> Reveal
    // `isPinRevealed` is old, `isVaultUnlocked` is false -> Entry
    // `isVaultUnlocked` is true -> Unlocked
    // This is hard to manage. A simpler way: The component that opens the modal decides what it shows.
    // The search bar opens the modal for pin REVEAL. The dashboard button opens it for pin ENTRY.
    // I can't pass props here easily. Let's use `isVaultUnlocked` as the primary gate.

    if(isVaultUnlocked) {
      return <UnlockedMessage />;
    }
    
    // When the modal is first opened via search, `pin` is fresh.
    if(open && isPinRevealed && !isVaultUnlocked) {
      // The modal's purpose depends on who opened it. Let's assume the dashboard button opens it when isPinRevealed is true.
      // So if this modal is open, and we're not unlocked yet, it must be for entry. Unless the PIN was just revealed.
      // Let's make it simpler: the VaultModal can have a `purpose` prop.
      // Or... if pin is not null, but not unlocked, show pin entry.
      // This is still tricky. Let's use a simpler logic for the demo.
      // The search bar reveals the PIN. The button on the dashboard opens the modal for entry.
      // So if the modal is open, we can assume it's for entry or it's unlocked.
      // The search bar modal will be different. Ok, I'll have two contents.

      // If called from dashboard
      if (pin) return <PinEntry />;
    }
    
    // If called from Header after typing HOBBYDORK
    return <PinReveal />;
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">{renderContent()}</DialogContent>
    </Dialog>
  );
}
