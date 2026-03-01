'use client';

import { useState, useEffect, useRef, useMemo, use } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, MoreVertical, ShieldCheck, Loader2, Flag } from 'lucide-react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import Link from 'next/link';
import { cn, getRandomAvatar, filterProfanity } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const { data: messages, isLoading: messagesLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const partnerId = useMemo(() => threadData?.participantUids?.find((p: string) => p !== user?.uid), [threadData, user]);
  const partnerName = threadData?.participantNames?.[partnerId || ''] || 'Collector';

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !db || !user || !partnerId) return;

    // Apply global profanity filter
    const sanitizedText = filterProfanity(messageText.trim());

    const privateMessage = {
      text: sanitizedText,
      senderId: user.uid,
      timestamp: serverTimestamp(),
    };

    setMessageText('');

    addDoc(collection(db, 'conversations', chatId, 'messages'), privateMessage)
      .then(() => {
        if (threadRef) updateDoc(threadRef, { lastMessage: sanitizedText, lastTimestamp: serverTimestamp() });
      })
      .catch(async (error) => {
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl flex flex-col">
        <Link href="/messages" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 font-bold uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Inbox
        </Link>

        <Card className="flex-1 flex flex-col shadow-2xl rounded-3xl overflow-hidden min-h-[600px]">
          <CardHeader className="bg-primary text-white p-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={partnerAvatar} />
                <AvatarFallback>{partnerName[0]}</AvatarFallback>
              </Avatar>
              <div><h3 className="font-bold uppercase tracking-tight">@{partnerName}</h3><p className="text-[9px] text-accent font-black uppercase"><ShieldCheck className="inline w-3 h-3 mr-1" />Verified Negotiation</p></div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 bg-white">
            <ScrollArea className="flex-1 p-6 h-[500px]">
              <div className="space-y-4">
                {messages?.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[70%] p-3 rounded-2xl text-sm", msg.senderId === user?.uid ? "bg-accent text-white" : "bg-zinc-100")}>{msg.text}</div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t bg-zinc-50">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input placeholder="Propose a deal..." value={messageText} onChange={(e) => setMessageText(e.target.value)} className="rounded-full h-12 px-6" />
                <Button type="submit" disabled={!messageText.trim()} className="h-12 w-12 rounded-full bg-accent text-white"><Send className="w-5 h-5" /></Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
