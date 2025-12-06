'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';

import AppLayout from '@/components/layout/AppLayout';
import PlaceholderContent from '@/components/PlaceholderContent';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import {
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
} from '@/firebase';

import {
  doc,
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import { ArrowLeft, MessageCircle } from 'lucide-react';

type ConversationDoc = {
  id?: string;
  participants?: string[];
  participantUids?: string[];
  participantDisplayNames?: Record<string, string>;
  participantAvatarUrls?: Record<string, string>;
  lastMessageText?: string;
  lastMessageSenderUid?: string;
  lastMessageAt?: any;
  createdAt?: any;
};

type MessageDoc = {
  id?: string;
  senderUid: string;
  text: string;
  createdAt?: any;
};

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params?.id;
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return doc(firestore, 'conversations', conversationId);
  }, [firestore, conversationId]);

  const {
    data: conversation,
    isLoading: convLoading,
  } = useDoc<ConversationDoc>(conversationRef as any);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return query(
      collection(
        firestore,
        'conversations',
        conversationId,
        'messages',
      ),
      orderBy('createdAt', 'asc'),
    );
  }, [firestore, conversationId]);

  const {
    data: messages,
    isLoading: msgsLoading,
  } = useCollection<MessageDoc>(messagesQuery as any);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [msgsLoading, messages?.length]);

  const handleSend = async () => {
    if (!firestore || !user || !conversationId) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      setSending(true);

      await addDoc(
        collection(
          firestore,
          'conversations',
          conversationId,
          'messages',
        ),
        {
          senderUid: user.uid,
          text: trimmed,
          createdAt: serverTimestamp(),
        },
      );

      const convRef = doc(
        firestore,
        'conversations',
        conversationId,
      );
      await updateDoc(convRef, {
        lastMessageText: trimmed,
        lastMessageSenderUid: user.uid,
        lastMessageAt: serverTimestamp(),
      });

      setText('');
      scrollToBottom();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error sending message',
        description:
          err?.message ?? 'Could not send your message.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending) handleSend();
    }
  };

  if (authLoading || convLoading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Sign in to view messages"
          description="You need to be logged in to see your conversations."
        >
          <div className="mt-4 flex justify-center gap-3">
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </PlaceholderContent>
      </AppLayout>
    );
  }

  if (!conversation) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Conversation not found"
          description="This conversation does not exist or you don&#39;t have access to it."
        >
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link href="/messages">Back to messages</Link>
            </Button>
          </div>
        </PlaceholderContent>
      </AppLayout>
    );
  }

  const participantArray =
    conversation.participants || conversation.participantUids || [];
  const otherUid =
    participantArray.find((p) => p !== user.uid) || '';
  const otherName =
    conversation.participantDisplayNames?.[otherUid] ||
    'User';
  const otherAvatar =
    conversation.participantAvatarUrls?.[otherUid] || '';

  const msgItems = (messages || []) as MessageDoc[];

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto h-[calc(100vh-7rem)] flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="mr-1"
            onClick={() => router.push('/messages')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Avatar className="h-9 w-9 md:h-10 md:w-10">
            <AvatarImage src={otherAvatar} />
            <AvatarFallback>
              {otherName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-semibold truncate">
                {otherName}
              </h1>
            </div>
            <p className="text-[11px] md:text-xs text-muted-foreground">
              Private conversation
            </p>
          </div>
        </div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="py-2 border-b flex flex-row items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm md:text-base">
              Conversation
            </CardTitle>
            <CardDescription className="text-xs md:text-[11px]">
              Messages are not end-to-end encrypted. Be cautious
              with payments.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
              {msgsLoading && (
                <>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-40" />
                </>
              )}

              {!msgsLoading &&
                msgItems.length === 0 && (
                  <p className="text-xs md:text-sm text-muted-foreground">
                    No messages yet. Say hi!
                  </p>
                )}

              {!msgsLoading &&
                msgItems.map((m) => {
                  const isMe = m.senderUid === user.uid;
                  const created =
                    m.createdAt?.toDate?.() ?? null;
                  const timeLabel =
                    created &&
                    format(created, 'MMM d, h:mm a');

                  return (
                    <div
                      key={m.id}
                      className={`flex ${
                        isMe
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm md:text-[0.95rem] leading-relaxed ${
                          isMe
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {m.text}
                        </p>
                        {timeLabel && (
                          <p className="mt-1 text-[10px] md:text-[11px] opacity-70 text-right">
                            {timeLabel}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t mt-3 pt-2 space-y-2">
              <Textarea
                rows={2}
                className="text-sm md:text-base resize-none"
                placeholder="Type your message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={sending || !text.trim()}
                  className="px-5"
                >
                  {sending ? 'Sending…' : 'Send'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
