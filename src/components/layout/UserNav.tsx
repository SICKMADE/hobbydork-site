'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { Bell, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { resolveAvatarUrl } from '@/lib/default-avatar';
import { getDefaultAvatarUrl } from '@/lib/default-avatar';


export function UserNav() {
  const { user } = useUser();
  const { logout, profile } = useAuth();
  const router = useRouter();
  if (!user || !profile) return null;

  const avatarSeed = profile.avatar && profile.avatar.trim() !== '' ? profile.avatar : (profile.uid || profile.email || '');
  const avatarUrl = resolveAvatarUrl(profile.avatar, avatarSeed);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0" aria-label="Account menu">
          <div className="flex flex-col items-center">
            <Avatar className="h-9 w-9 bg-transparent">
              <AvatarImage src={avatarUrl} alt={profile.displayName ?? undefined} />
              <AvatarFallback />
            </Avatar>
            <span className="text-xs font-medium mt-1 text-center w-16 truncate">{profile.displayName}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            {/* Notifications removed */}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
