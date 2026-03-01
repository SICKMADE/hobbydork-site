'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Search, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { query, collection, orderBy, limit, where, doc } from 'firebase/firestore';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { getRandomAvatar } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function MessagesInbox() {
  const { user, isUserLoading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const isVerificationComplete = !authLoading && !profileLoading;
  const isActive = profile?.status === 'ACTIVE';

  useEffect(() => {
    if (isVerificationComplete) {
      if (!user) router.push('/login');
      else if (!user.emailVerified) router.push('/verify-email');
      else if (!profile) router.push('/onboarding');
    }
  }, [user, profile, isVerificationComplete]);

  // Security Rule Alignment: Must be ACTIVE to list conversations
  const conversationsQuery = useMemoFirebase(() => {
    if (!db || !user || !isActive) return null;
    return query(
      collection(db, 'conversations'),
      where('participantUids', 'array-contains', user.uid),
      orderBy('lastTimestamp', 'desc'),
      limit(50)
    );
  }, [db, user?.uid, isActive]);

  const { data: conversations, isLoading: chatsLoading } = useCollection(conversationsQuery);

  if (!isVerificationComplete) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  if (!user || !isActive) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8 max-w-5xl flex flex-col min-h-0">
        <header className="mb-6 space-y-1">
          <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
            <MessageSquare className="w-3 h-3" /> Secure Inbox
          </div>
          <h1 className="text-2xl md:text-4xl font-headline font-black">Private Messages</h1>
        </header>

        <Card className="flex-1 border-none shadow-2xl bg-card overflow-hidden rounded-[2rem] min-h-0">
          <div className="grid md:grid-cols-[350px_1fr] h-[650px]">
            <div className="border-r flex flex-col min-h-0">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <Input 
                    placeholder="Search chats..." 
                    className="pl-9 rounded-full h-10 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="divide-y">
                  {chatsLoading ? (
                    <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></div>
                  ) : conversations?.length === 0 ? (
                    <div className="p-8 text-center font-bold text-muted-foreground uppercase text-xs">No chats yet</div>
                  ) : conversations?.map((chat) => {
                    const otherId = chat.participantUids.find((id: string) => id !== user?.uid);
                    const otherName = chat.participantNames?.[otherId || ''] || 'Collector';
                    const otherAvatar = chat.participantAvatars?.[otherId || ''] || getRandomAvatar(otherId);
                    
                    return (
                      <Link 
                        key={chat.id} 
                        href={`/messages/${chat.id}`}
                        className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={otherAvatar} />
                          <AvatarFallback className="font-black text-xs">{otherName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h4 className="font-bold text-sm truncate">@{otherName}</h4>
                            <span className="text-[8px] text-muted-foreground uppercase font-black">2h ago</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{chat.lastMessage || 'Starting negotiation...'}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="hidden md:flex flex-col items-center justify-center bg-zinc-50/50 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-accent mb-4 opacity-20" />
              <h3 className="text-xl font-headline font-black mb-2">Select a Thread</h3>
              <p className="text-muted-foreground text-sm max-w-xs font-medium italic">Communicate securely with other collectors to finalize your trades.</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
