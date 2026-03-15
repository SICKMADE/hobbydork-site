'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Users, MessageSquare, Loader2, ShieldAlert } from 'lucide-react';
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

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'communityMessages'), orderBy('timestamp', 'asc'), limit(100));
  }, [db]);

  const { data: messages, isLoading: messagesLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !db || !user) return;

    if (!user.emailVerified || profile?.status !== 'ACTIVE') {
      toast({ 
        variant: 'destructive', 
        title: "Verification Required", 
        description: "You must verify your email and have an active profile to participate in chat." 
      });
      return;
    }

    const sanitizedText = filterProfanity(messageText.trim());
    const isCustomPhoto = profile?.photoURL && profile.photoURL.startsWith('data:');
    const avatarUrl = isCustomPhoto ? profile.photoURL : getRandomAvatar(user.uid);

    const chatMessage = {
      text: sanitizedText,
      senderId: user.uid,
      senderName: profile?.username ? `@${profile.username}` : (user.displayName || 'Anonymous Collector'),
      avatarUrl,
      timestamp: serverTimestamp(),
    };

      addDoc(collection(db, 'communityMessages'), chatMessage)
        .then(() => {
          setMessageText('');
        })
        .catch(async (error) => {
          toast({
            variant: 'destructive',
            title: 'Message Failed',
            description: 'Could not send your message. Please try again.'
          });
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'communityMessages',
            operation: 'create',
            requestResourceData: chatMessage,
          }));
        });
  };

  return (
    <div className="min-h-screen h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8 max-w-4xl flex flex-col min-h-0">
        <Card>
          <CardContent>
            <header className="mb-4 space-y-1">
              <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
                <MessageSquare className="w-3 h-3" /> Live Lobby
              </div>
              <h1 className="text-2xl md:text-4xl font-headline font-black">Community Chat</h1>
            </header>
            <form onSubmit={handleSendMessage} className="flex gap-2" aria-label="Message form">
              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 rounded-full h-12 px-6 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                aria-label="Message input"
              />
              <Button
                type="submit"
                disabled={!messageText.trim()}
                className="h-12 w-12 rounded-full bg-accent text-white hover:bg-accent/90 shrink-0"
                aria-label="Send message"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
            <ScrollArea className="flex-1 p-4 md:p-6">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
                ) : messages?.map((msg, idx) => (
                  <div key={msg.id || idx} className={cn("flex gap-3", msg.senderId === user?.uid ? "flex-row-reverse" : "flex-row")}> 
                    <Avatar className="w-8 h-8 border-2 border-white shadow-sm shrink-0">
                      <AvatarImage src={msg.avatarUrl || getRandomAvatar(msg.senderId)} />
                      <AvatarFallback className="text-[10px] font-black">{msg.senderName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className={cn("max-w-[80%] space-y-1", msg.senderId === user?.uid ? "items-end text-right" : "items-start")}> 
                      <span className="text-[9px] font-black uppercase text-zinc-500">{msg.senderName}</span>
                      <div className={cn("px-4 py-2 rounded-2xl text-sm shadow-sm", msg.senderId === user?.uid ? "bg-accent text-white" : "bg-zinc-100 text-zinc-900")}> 
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
            <div className="p-4 bg-zinc-900 border-t mt-auto">
              {!user ? (
                <div className="flex items-center justify-center p-2 text-white/60 text-xs font-bold uppercase tracking-widest gap-2">
                  <ShieldAlert className="w-4 h-4" /> Sign in to chat
                </div>
              ) : !user.emailVerified ? (
                <div className="flex items-center justify-center p-2 text-white/60 text-xs font-bold uppercase tracking-widest gap-2">
                  <ShieldAlert className="w-4 h-4" /> Verify email to participate
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2" aria-label="Message form">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 rounded-full h-12 px-6 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    aria-label="Message input"
                  />
                  <Button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="h-12 w-12 rounded-full bg-accent text-white hover:bg-accent/90 shrink-0"
                    aria-label="Send message"
                    title="Send message"
                  >
                    <Send className="w-5 h-5" />
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
