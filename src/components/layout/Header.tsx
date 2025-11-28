'use client';
import { Search } from 'lucide-react';
import { SidebarTrigger } from '../ui/sidebar';
import { Input } from '../ui/input';
import { UserNav } from './UserNav';
import Logo from '../Logo';
import { VaultModal } from '../VaultModal';
import { useState } from 'react';
import { useVault } from '@/lib/vault';

export default function Header() {
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { revealPin, showVaultButton } = useVault();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.toUpperCase() === 'HOBBYDORK') {
      revealPin();
      showVaultButton();
      setIsVaultModalOpen(true);
      setSearchTerm('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <div className="hidden md:block">
            <Logo iconOnly />
          </div>
        </div>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <form className="ml-auto flex-1 sm:flex-initial">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search collectibles..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </form>
          <UserNav />
        </div>
      </header>
      <VaultModal open={isVaultModalOpen} onOpenChange={setIsVaultModalOpen} />
    </>
  );
}
