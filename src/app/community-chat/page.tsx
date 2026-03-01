'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Users, MessageSquare, Loader2 } from 'lucide-react';
import { useCollection, useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, addDoc, query, orderBy, limit, serverTimestamp, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
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

  // Synchronized with firestore.rules collection name
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

    // Apply global profanity filter
    const sanitizedText = filterProfanity(messageText.trim());

    // Only use custom photos (data: URLs only)
    const isCustomPhoto = profile?.photoURL && profile.photoURL.startsWith('data:');
    const avatarUrl = isCustomPhoto ? profile.photoURL : getRandomAvatar(user.uid);

    const chatMessage = {
      text: sanitizedText,
      senderId: user.uid,
      senderName: profile?.username ? `@${profile.username}` : (user.displayName || 'Anonymous Collector'),
      avatarUrl,
      timestamp: serverTimestamp(),
    };

    setMessageText('');

    addDoc(collection(db, 'communityMessages'), chatMessage).catch(async (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'communityMessages',
        operation: 'create',
        requestResourceData: chatMessage,
      } satisfies SecurityRuleContext));
      toast({ variant: 'destructive', title: "Access Denied", description: "You must be a verified active member to chat." });
    });
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8 max-w-4xl flex flex-col min-h-0">
        <header className="mb-4 md:mb-8 space-y-1">
          <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
            <MessageSquare className="w-3 h-3" /> Live Lobby
          </div>
          <h1 className="text-2xl md:text-4xl font-headline font-black">Community Chat</h1>
        </header>

        <Card className="flex-1 flex flex-col border-none shadow-2xl bg-card dark:bg-white overflow-hidden rounded-[2rem] min-h-0">
          <CardHeader className="bg-red-600 text-white py-4 px-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-white" />
              <CardTitle className="text-sm md:text-lg">Main Lobby</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0 dark:bg-white">
            <ScrollArea className="flex-1 p-4 md:p-6">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
                ) : messages?.map((msg, idx) => {
                  // Only use custom photos (data: URLs only)
                  const isCustomAvatar = msg.avatarUrl && msg.avatarUrl.startsWith('data:');
                  const displayAvatar = isCustomAvatar ? msg.avatarUrl : getRandomAvatar(msg.senderId);
                  
                  return (
                  <div key={msg.id || idx} className={cn("flex gap-3", msg.senderId === user?.uid ? "flex-row-reverse" : "flex-row")}>
                    <Avatar className="w-8 h-8 md:w-10 h-10 border-2 border-white shadow-sm">
                      <AvatarImage src={displayAvatar} />
                      <AvatarFallback className="bg-zinc-100 text-[10px] font-black">{msg.senderName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className={cn("max-w-[70%] space-y-1", msg.senderId === user?.uid ? "items-end text-right" : "items-start")}>
                      <span className="text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-600">{msg.senderName}</span>
                      <div className={cn("px-4 py-2 rounded-2xl text-sm", msg.senderId === user?.uid ? "bg-accent text-white" : "bg-zinc-100 dark:bg-zinc-200")}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 bg-[#4f4f4f] border-t mt-auto">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 rounded-full h-12 px-6"
                />
                <Button type="submit" disabled={!messageText.trim()} className="h-12 w-12 rounded-full bg-white text-gray-700 hover:bg-gray-100">
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
