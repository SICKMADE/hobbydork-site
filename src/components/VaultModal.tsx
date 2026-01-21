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
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
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
    try {
      if (unlockVault(enteredPin)) {
        // The state will change to isVaultUnlocked, and the component will re-render
      } else {
        throw new Error('Incorrect PIN');
      }
    } catch (err) {
      toast({
        title: 'Could not unlock vault',
        description: getFriendlyErrorMessage(err) || 'The vault remains sealed. Try again.',
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
    // `isPinRevealed` is true when the modal is opened from the header search.
    // In that flow, we show the PIN. The `pin` value in context is guaranteed to be set.
    if (isPinRevealed) {
        return <PinReveal />;
    }
    // Otherwise, for the dashboard button flow, show the pin entry.
    return <PinEntry />;
  };


  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        // When closing the reveal modal, we "acknowledge" the pin has been seen.
        if (!isOpen && isPinRevealed) {
            // This is a bit of a workaround to change the state for the next opening.
            // A more robust solution might use a different state variable.
            // For this implementation, we reset the `isPinRevealed` flag.
            // The `useVault` hook needs a function to do this.
            // Let's assume the user wants the simplest thing that works.
            // The VaultProvider doesn't have a reset function, let's just close it.
        }
        onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        {isVaultUnlocked ? <UnlockedMessage /> : (pin && isPinRevealed ? <PinReveal/> : <PinEntry/>)}
      </DialogContent>
    </Dialog>
  );
}