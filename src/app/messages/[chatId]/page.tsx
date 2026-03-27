'use client';

import { useState, useEffect, useRef, useMemo, use } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, ShieldCheck, Loader2, Mail } from 'lucide-react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import Link from 'next/link';
import { cn, getRandomAvatar, filterProfanity } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';

export default function PrivateChatThread({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);
  const { user, isUserLoading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const threadRef = useMemoFirebase(() => db && chatId ? doc(db, 'conversations', chatId) : null, [db, chatId]);
  const messagesQuery = useMemoFirebase(() => db && chatId ? query(collection(db, 'conversations', chatId, 'messages'), orderBy('timestamp', 'asc')) : null, [db, chatId]);

  const { data: threadData, isLoading: threadLoading } = useDoc(threadRef);
  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const partnerId = useMemo(() => threadData?.participantUids?.find((p: string) => p !== user?.uid), [threadData, user]);
  const partnerName = threadData?.participantNames?.[partnerId || ''] || 'Collector';

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !db || !user || !partnerId) return;

    const sanitizedText = filterProfanity(messageText.trim());
    const privateMessage = { text: sanitizedText, senderId: user.uid, timestamp: serverTimestamp() };

    setMessageText('');

    addDoc(collection(db, 'conversations', chatId, 'messages'), privateMessage)
      .then(() => {
        if (threadRef) updateDoc(threadRef, { lastMessage: sanitizedText, lastTimestamp: serverTimestamp() });
      })
      .catch(async (error) => {
        toast({ variant: 'destructive', title: 'Message Failed', description: getFriendlyErrorMessage(error) });
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `conversations/${chatId}/messages`,
          operation: 'create',
          requestResourceData: privateMessage,
        } satisfies SecurityRuleContext));
      });
  };

  if (authLoading || threadLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  const partnerAvatar = threadData?.participantAvatars?.[partnerId || ''] || getRandomAvatar(partnerId);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* SKINNY HUD HEADER */}
      <header className="py-0 mb-6">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-zinc-950 rounded-b-2xl p-4 md:p-6 shadow-2xl text-white flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 hardware-grid-overlay opacity-[0.05]" />
            <div className="relative z-10 flex items-center gap-4">
              <Link href="/messages" className="text-white/40 hover:text-accent transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-accent font-bold uppercase text-[10px] tracking-widest mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Secure Channel with
                </div>
                <h1 className="text-xl md:text-3xl font-headline font-black tracking-tighter uppercase italic leading-none">
                  @{partnerName}
                </h1>
              </div>
            </div>
            
            <div className="relative z-10 hidden sm:flex items-center gap-4">
               <Avatar className="w-10 h-10 md:w-12 md:h-12 border-2 border-white/20">
                <AvatarImage src={partnerAvatar} />
                <AvatarFallback className="text-zinc-900 font-black">{partnerName[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 max-w-4xl flex flex-col min-h-0 mb-8">
        <Card className="flex-1 flex flex-col shadow-2xl rounded-[1.5rem] md:rounded-[2rem] overflow-hidden min-h-0 bg-card border-none">
          <CardHeader className="bg-zinc-900 text-white p-4 flex flex-row items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">End-to-End Encryption</span>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0 bg-zinc-50 dark:bg-zinc-900/50">
            <ScrollArea className="flex-1 p-4 md:p-6">
              <div className="space-y-4">
                {messages?.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] p-3 md:p-4 rounded-2xl text-sm md:text-base shadow-sm font-bold border",
                      msg.senderId === user?.uid 
                        ? "bg-zinc-950 text-white border-zinc-800" 
                        : "bg-white text-black border-zinc-100"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
            <div className="p-4 bg-white dark:bg-zinc-950 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto w-full">
                <Input 
                  placeholder="Propose a deal..." 
                  aria-label="Message"
                  value={messageText} 
                  onChange={(e) => setMessageText(e.target.value)} 
                  className="rounded-xl h-12 md:h-14 px-6 border-2 bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white placeholder:text-zinc-400 focus-visible:ring-accent shadow-sm"
                />
                <Button type="submit" disabled={!messageText.trim()} title="Send message" className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-accent text-white hover:bg-accent/90 shrink-0 shadow-lg active:scale-95 transition-all">
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
