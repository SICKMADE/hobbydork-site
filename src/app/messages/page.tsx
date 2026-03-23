'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Search, Loader2, Mail, PlusCircle, UserPlus, Send, Lock } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { query, collection, orderBy, limit, where, doc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { getRandomAvatar } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

function MessagesInboxContent() {
  const { user, isUserLoading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const sellerParam = searchParams?.get('seller');
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeUsername, setComposeUsername] = useState('');
  const [isSearchingUser, setIsSearchingUser] = useState(false);

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const isVerificationComplete = !authLoading && !profileLoading;
  const isActive = profile?.status === 'ACTIVE';

  // Handle incoming seller param from listings/ISO
  useEffect(() => {
    const handleSellerParam = async () => {
      if (!sellerParam || !user || !db || creatingConversation) return;
      
      const targetHandle = sellerParam.toLowerCase();

      // Prevent messaging self
      if (targetHandle === profile?.username?.toLowerCase()) {
        toast({ title: "Note", description: "You cannot message yourself." });
        router.replace('/messages');
        return;
      }

      setCreatingConversation(true);
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), where('username', '==', targetHandle)));
        if (usersSnap.empty) {
          toast({ variant: 'destructive', title: "User not found", description: "The collector you're trying to message doesn't exist." });
          setCreatingConversation(false);
          router.replace('/messages');
          return;
        }
        
        const sellerUid = usersSnap.docs[0].id;
        const sellerData = usersSnap.docs[0].data();
        
        // Find existing conversation
        const existingConvs = await getDocs(query(
          collection(db, 'conversations'), 
          where('participantUids', 'array-contains', user.uid)
        ));
        
        let existingConvId = null;
        for (const conv of existingConvs.docs) {
          if (conv.data().participantUids.includes(sellerUid)) {
            existingConvId = conv.id;
            break;
          }
        }

        if (existingConvId) {
          router.push(`/messages/${existingConvId}`);
        } else {
          // Create new conversation
          const convData = {
            participantUids: [user.uid, sellerUid],
            participantNames: {
              [user.uid]: profile?.username || user.displayName || 'User',
              [sellerUid]: sellerData.username || sellerParam,
            },
            participantAvatars: {
              [user.uid]: (profile?.photoURL?.startsWith('data:')) ? profile.photoURL : getRandomAvatar(user.uid),
              [sellerUid]: (sellerData.photoURL?.startsWith('data:')) ? sellerData.photoURL : getRandomAvatar(sellerUid),
            },
            createdAt: serverTimestamp(),
            lastTimestamp: serverTimestamp(),
            lastMessage: 'Conversation started',
          };
          const newConv = await addDoc(collection(db, 'conversations'), convData);
          router.push(`/messages/${newConv.id}`);
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to open chat." });
      } finally {
        setCreatingConversation(false);
      }
    };

    if (isVerificationComplete && user && isActive) {
      handleSellerParam();
    }
  }, [sellerParam, user, db, creatingConversation, router, isVerificationComplete, isActive, profile, toast]);

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

  const handleStartCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeUsername.trim() || isSearchingUser) return;
    
    setIsSearchingUser(true);
    const target = composeUsername.trim().toLowerCase().replace('@', '');
    
    if (target === profile?.username?.toLowerCase()) {
      toast({ variant: 'destructive', title: "Logic Error", description: "You cannot start a chat with yourself." });
      setIsSearchingUser(false);
      return;
    }

    router.push(`/messages?seller=${target}`);
    setIsComposeOpen(false);
    setComposeUsername('');
    setIsSearchingUser(false);
  };

  if (!isVerificationComplete) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  if (!user || !isActive) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Navbar />
        <Card className="p-12 text-center space-y-6 max-w-md rounded-[2.5rem] border-2 border-dashed">
          <Lock className="w-12 h-12 text-zinc-300 mx-auto" />
          <h2 className="text-2xl font-headline font-black uppercase italic">Access Restricted</h2>
          <p className="text-muted-foreground font-medium">Verify your identity and activate your profile to use the secure messaging system.</p>
          <Button asChild title="Go to verification screen" className="bg-accent text-white font-black uppercase h-14 rounded-xl px-10 shadow-xl">
            <Link href="/verify-email">Verify Identity</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8 max-w-5xl flex flex-col min-h-0">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
              <Mail className="w-3 h-3" /> Secure Inbox
            </div>
            <h1 className="text-2xl md:text-4xl font-headline font-black uppercase italic tracking-tighter">Messages</h1>
          </div>
          
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button title="Compose new message" className="bg-accent text-white hover:bg-accent/90 font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-full shadow-lg gap-2">
                <PlusCircle className="w-4 h-4" /> New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
              <div className="bg-zinc-950 p-8 text-white">
                <DialogHeader>
                  <div className="bg-accent/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <UserPlus className="w-6 h-6 text-accent" />
                  </div>
                  <DialogTitle className="text-2xl font-headline font-black uppercase italic tracking-tight">Direct Message</DialogTitle>
                  <DialogDescription className="text-zinc-400 font-medium pt-1">
                    Enter a username to start a private negotiation.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-8 space-y-6 bg-card">
                <form onSubmit={handleStartCompose} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-black">@</span>
                      <Input 
                        placeholder="username" 
                        value={composeUsername}
                        onChange={(e) => setComposeUsername(e.target.value)}
                        className="pl-9 h-14 rounded-xl border-2 font-bold text-lg bg-white text-black placeholder:text-zinc-400 focus-visible:ring-accent shadow-sm"
                        autoFocus
                        aria-label="Target username"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    title="Search for user and start chat"
                    disabled={!composeUsername.trim() || isSearchingUser}
                    className="w-full h-14 bg-zinc-950 text-white hover:bg-zinc-800 font-black rounded-xl shadow-xl transition-all gap-2"
                  >
                    {isSearchingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Initiate Protocol
                  </Button>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <Card className="flex-1 border-none shadow-2xl bg-card overflow-hidden rounded-[1.5rem] md:rounded-[2rem] min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] h-[calc(100vh-16rem)] md:h-[650px]">
            <div className="border-r flex flex-col min-h-0 bg-card">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                  <Input 
                    placeholder="Search inbox..." 
                    className="pl-9 rounded-full h-10 text-xs border-2 bg-white text-black placeholder:text-zinc-400 focus-visible:ring-accent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search conversations"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="divide-y">
                  {chatsLoading ? (
                    <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></div>
                  ) : !conversations || conversations.length === 0 ? (
                    <div className="p-12 text-center space-y-4">
                      <MessageSquare className="w-10 h-10 text-zinc-200 mx-auto" />
                      <div className="space-y-1">
                        <p className="font-black text-zinc-400 uppercase text-[10px] tracking-widest leading-tight">No active protocols</p>
                        <p className="text-[9px] text-zinc-300 font-bold uppercase">Click "New Message" to start</p>
                      </div>
                    </div>
                  ) : conversations
                      .filter(c => {
                        const otherId = c.participantUids.find((id: string) => id !== user?.uid);
                        const otherName = c.participantNames?.[otherId || '']?.toLowerCase() || '';
                        return otherName.includes(searchQuery.toLowerCase());
                      })
                      .map((chat) => {
                        const otherId = chat.participantUids.find((id: string) => id !== user?.uid);
                        const otherName = chat.participantNames?.[otherId || ''] || 'Collector';
                        const otherAvatar = chat.participantAvatars?.[otherId || ''] || getRandomAvatar(otherId);
                        
                        return (
                          <Link 
                            key={chat.id} 
                            href={`/messages/${chat.id}`}
                            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
                          >
                            <Avatar className="w-12 h-12 border-2 border-background shadow-sm shrink-0 transition-transform group-hover:scale-105">
                              <AvatarImage src={otherAvatar} />
                              <AvatarFallback className="font-black text-xs">{otherName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-0.5">
                                <h4 className="font-black text-sm truncate uppercase tracking-tight text-foreground">@{otherName}</h4>
                                <span className="text-[8px] text-zinc-400 uppercase font-black">
                                  {chat.lastTimestamp?.toDate ? new Date(chat.lastTimestamp.toDate()).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate font-medium">{chat.lastMessage || 'Open communication window...'}</p>
                            </div>
                          </Link>
                        );
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="hidden md:flex flex-col items-center justify-center bg-muted/10 p-12 text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-accent blur-3xl opacity-10 animate-pulse" />
                <div className="relative w-24 h-24 bg-card shadow-2xl rounded-3xl flex items-center justify-center border-2 border-dashed border-accent/20">
                  <MessageSquare className="w-12 h-12 text-accent opacity-40" />
                </div>
              </div>
              <div className="space-y-2 max-w-xs">
                <h3 className="text-2xl font-headline font-black uppercase italic tracking-tight">Select a Protocol</h3>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed italic">
                  All marketplace communication is end-to-end encrypted and monitored for community safety protocols.
                </p>
              </div>
              <Button 
                variant="outline" 
                title="Compose new message"
                onClick={() => setIsComposeOpen(true)}
                className="rounded-xl border-2 border-border font-black uppercase text-[10px] tracking-widest px-8"
              >
                Compose New Message
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default function MessagesInbox() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <MessagesInboxContent />
    </Suspense>
  );
}
