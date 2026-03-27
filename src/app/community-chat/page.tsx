'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageSquare, Loader2, ShieldCheck, Activity, Radio, ChevronRight } from 'lucide-react';
import { useCollection, useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, addDoc, query, orderBy, limit, serverTimestamp, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn, getRandomAvatar, filterProfanity } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function CommunityChat() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasLoadedInitial = useRef(false);

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'communityMessages'), orderBy('timestamp', 'asc'), limit(100));
  }, [db]);

  const { data: messages, isLoading: messagesLoading } = useCollection(messagesQuery);

  // Auto-scroll logic that stays within the chat box and doesn't jump the whole page
  useEffect(() => {
    if (scrollRef.current && messages && messages.length > 0) {
      // We look for the internal viewport of the ScrollArea to avoid window-level jumping
      const viewport = scrollRef.current.closest('[data-radix-scroll-area-viewport]');
      if (viewport) {
        if (!hasLoadedInitial.current) {
          // Snap to bottom instantly on first load so user starts at the top of the PAGE
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'auto' });
          hasLoadedInitial.current = true;
        } else {
          // Smooth scroll for new messages while user is already in the chat
          scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !db || !user) return;

    if (!user.emailVerified || profile?.status !== 'ACTIVE') {
      toast({ 
        variant: 'destructive', 
        title: "Permission Denied", 
        description: "Please verify your email to join the chat." 
      });
      return;
    }

    const sanitizedText = filterProfanity(messageText.trim());
    const avatarUrl = profile?.photoURL || getRandomAvatar(user.uid);

    const chatMessage = {
      text: sanitizedText,
      senderId: user.uid,
      senderName: profile?.username ? `@${profile.username}` : (user.displayName || 'Anonymous'),
      avatarUrl,
      timestamp: serverTimestamp(),
    };

    setMessageText('');

    addDoc(collection(db, 'communityMessages'), chatMessage).catch(async (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'communityMessages',
        operation: 'create',
        requestResourceData: chatMessage,
      }));
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* COMPACT HEADER - MATCHES BROWSE SIZE */}
      <header className="py-0 mb-6 md:mb-12">
        <div className="max-w-5xl mx-auto bg-zinc-950 rounded-b-2xl p-6 md:p-10 shadow-2xl text-white space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 hardware-grid-overlay opacity-[0.05]" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-600/30 animate-scanline" />
          </div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-600 font-bold uppercase text-[10px] tracking-widest">
                <Radio className="w-4 h-4 animate-pulse" /> Live Chat Lobby
              </div>
              <h1 className="text-3xl md:text-6xl font-headline font-black tracking-tighter uppercase italic leading-none">
                Community <span className="text-red-600">Chat</span>
              </h1>
              <p className="text-zinc-400 text-sm font-medium">Join the live conversation with other collectors.</p>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <div className="text-right">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">CONNECTION_STATUS</p>
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                  <Activity className="w-3 h-3 text-green-500 animate-pulse" />
                  <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 max-w-5xl flex flex-col mb-8 min-h-0">
        <Card className="flex-1 flex flex-col border-2 border-zinc-200 dark:border-zinc-800 shadow-2xl bg-card overflow-hidden rounded-[2rem] h-[calc(100vh-120px)] md:h-[calc(100vh-120px)]">
          {/* CHAT HEADER BAR */}
          <div className="bg-zinc-950 p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">General Chat</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Secure Connection</span>
            </div>
          </div>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0 bg-zinc-50 dark:bg-zinc-900/50">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {messagesLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                    <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Loading messages...</p>
                  </div>
                ) : messages?.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto border-2 border-zinc-100 dark:border-white/5 shadow-sm">
                      <Radio className="w-8 h-8 text-zinc-300" />
                    </div>
                    <p className="text-xs font-black uppercase text-zinc-400 tracking-widest italic">No messages yet. Start the conversation!</p>
                  </div>
                ) : messages?.map((msg, idx) => (
                  <div key={msg.id || idx} className={cn("flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300", msg.senderId === user?.uid ? "flex-row-reverse" : "flex-row")}>
                    <Avatar className="w-10 h-10 md:w-12 md:h-12 border-2 border-white shadow-sm shrink-0">
                      <AvatarImage src={msg.avatarUrl} />
                      <AvatarFallback className="font-black text-xs">{msg.senderName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className={cn("max-w-[75%] space-y-1.5 flex flex-col", msg.senderId === user?.uid ? "items-end text-right" : "items-start")}>
                      <span className={cn("text-[10px] font-black uppercase tracking-tight", msg.senderId === user?.uid ? "text-red-600" : "text-zinc-500")}>
                        {msg.senderName}
                      </span>
                      <div className={cn(
                        "px-5 py-3 rounded-2xl text-sm font-bold shadow-sm border-2",
                        msg.senderId === user?.uid 
                          ? "bg-zinc-950 text-white border-zinc-800" 
                          : "bg-white text-zinc-950 border-zinc-100 dark:bg-zinc-800 dark:text-white dark:border-white/5"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} className="h-1" />
              </div>
            </ScrollArea>

            <div className="p-6 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-white/5">
              {!user ? (
                <div className="text-center py-2">
                  <Button asChild variant="outline" className="rounded-xl font-black uppercase text-[10px] h-12 px-10">
                    <a href="/login">Sign in to join the conversation</a>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto w-full">
                  <Input
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 rounded-xl h-14 px-6 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 font-bold text-base focus-visible:ring-red-600"
                  />
                  <Button 
                    type="submit" 
                    disabled={!messageText.trim()} 
                    title="Send message"
                    className="h-14 w-14 rounded-xl bg-red-600 text-white hover:bg-red-700 shrink-0 shadow-xl shadow-red-600/20 active:scale-95 transition-all"
                  >
                    <Send className="w-6 h-6" />
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
