'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface VaultContextType {
  pin: string | null;
  isPinRevealed: boolean;
  isVaultUnlocked: boolean;
  isVaultButtonVisible: boolean;
  revealPin: () => void;
  unlockVault: (enteredPin: string) => boolean;
  showVaultButton: () => void;
  acknowledgePin: () => void;
}

const VaultContext = createContext<VaultContextType | null>(null);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState<string | null>(null);
  const [isPinRevealed, setIsPinRevealed] = useState(false);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [isVaultButtonVisible, setIsVaultButtonVisible] = useState(false);

  const revealPin = useCallback(() => {
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(newPin);
    setIsPinRevealed(true);
  }, []);

  const showVaultButton = useCallback(() => {
    setIsVaultButtonVisible(true);
  }, []);

  const unlockVault = useCallback((enteredPin: string) => {
    if (enteredPin === pin) {
      setIsVaultUnlocked(true);
      return true;
    }
    return false;
  }, [pin]);

  const acknowledgePin = useCallback(() => {
    setIsPinRevealed(false);
  }, []);

  const value = { pin, isPinRevealed, isVaultUnlocked, isVaultButtonVisible, revealPin, unlockVault, showVaultButton, acknowledgePin };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    // Production: User-friendly error
    throw new Error('Vault error: This feature must be used within a VaultProvider. Please contact support if this persists.');
  }
  return context;
};
