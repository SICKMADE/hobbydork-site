'use client';

import { useState, useEffect, useRef, useMemo, use } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
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
    addDoc(collection(db, 'conversations', chatId, 'messages'), privateMessage)
      .then(() => {
        setMessageText('');
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
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8 max-w-4xl flex flex-col min-h-0">
        <Link href="/messages" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary mb-4 font-black uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Inbox
        </Link>

        <Card className="flex-1 flex flex-col shadow-2xl rounded-[1.5rem] md:rounded-[2rem] overflow-hidden min-h-0 bg-white">
          <CardHeader className="bg-zinc-900 text-white p-4 md:p-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-10 h-10 md:w-12 md:h-12 border-2 border-white/20">
                <AvatarImage src={partnerAvatar} />
                <AvatarFallback className="text-zinc-900 font-black">{partnerName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-black uppercase tracking-tight text-sm md:text-xl">@{partnerName}</h3>
                <p className="text-[8px] md:text-[9px] text-zinc-400 font-black uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-accent" /> Verified Protocol
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <ScrollArea className="flex-1 p-4 md:p-6 bg-zinc-50/30">
              <div className="space-y-4">
                {messages?.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] p-3 md:p-4 rounded-2xl text-sm md:text-base shadow-sm font-medium",
                      msg.senderId === user?.uid ? "bg-accent text-white" : "bg-white text-zinc-900 border border-zinc-100"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto w-full">
                <Input 
                  placeholder="Propose a deal..." 
                  value={messageText} 
                  onChange={(e) => setMessageText(e.target.value)} 
                  className="rounded-full h-12 md:h-14 px-6 border-2 focus-visible:ring-accent" 
                />
                <Button type="submit" disabled={!messageText.trim()} className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-accent text-white hover:bg-accent/90 shrink-0 shadow-lg">
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