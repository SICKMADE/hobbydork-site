'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import {
  useCollection,
  useDoc,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import {
  addDoc,
  collection,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function ConversationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useAuth();

  const conversationId = searchParams.get('id') || undefined;

  // ---------- INBOX: all conversations for current user ----------

  const inboxQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'conversations'),
      where('participantUids', 'array-contains', user.uid),
      // no orderBy to avoid extra index; Firestore will return some order
    );
  }, [firestore, user]);

  const {
    data: conversations,
    isLoading: inboxLoading,
  } = useCollection<any>(inboxQuery);

  // ---------- SELECTED CONVERSATION DOC ----------

  const convoRef = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return doc(firestore, 'conversations', conversationId);
  }, [firestore, conversationId]);

  const { data: conversation } = useDoc<any>(convoRef);

  // ---------- MESSAGES FOR SELECTED CONVERSATION ----------

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return query(
      collection(firestore, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
    );
  }, [firestore, conversationId]);

  const { data: messages } = useCollection<any>(messagesQuery);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  const handleSend = async () => {
    if (!firestore || !user || !conversationId || !text.trim()) return;

    setSending(true);
    try {
      const msgRef = collection(
        firestore,
        'conversations',
        conversationId,
        'messages',
      );
      const trimmed = text.trim();

      await addDoc(msgRef, {
        text: trimmed,
        senderUid: user.uid,
        createdAt: serverTimestamp(),
      });

      // Best-effort update of conversation metadata (for future sorting/previews)
      try {
        const convDocRef = doc(firestore, 'conversations', conversationId);
        await updateDoc(convDocRef, {
          lastMessageText: trimmed,
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Failed to update conversation metadata', e);
      }

      setText('');
    } catch (e) {
      console.error('Failed to send message', e);
    } finally {
      setSending(false);
    }
  };

  const otherParticipant =
    conversation &&
    Array.isArray(conversation.participantUids) &&
    user
      ? conversation.participantUids.find((uid: string) => uid !== user.uid)
      : null;

  const handleSelectConversation = (id: string) => {
    router.push(`/conversations?id=${encodeURIComponent(id)}`);
  };

  return (
    <AppLayout>
      <div className="mx-auto flex max-w-5xl gap-4 py-4">
        {/* ---------- LEFT: INBOX LIST ---------- */}
        <aside className="w-64 flex-shrink-0 rounded-2xl border bg-card/80 p-3">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Conversations
          </h2>

          {inboxLoading && (
            <p className="text-xs text-muted-foreground">Loading…</p>
          )}

          {!inboxLoading && (!conversations || conversations.length === 0) && (
            <p className="text-xs text-muted-foreground">
              No private messages yet.
            </p>
          )}

          <div className="mt-2 space-y-1">
            {conversations?.map((conv: any) => {
              const convId = conv.id || conv.conversationId;
              const other =
                conv.participantUids && user
                  ? conv.participantUids.find((uid: string) => uid !== user.uid)
                  : 'Unknown';

              const preview = conv.lastMessageText || 'No messages yet';

              const isActive = conversationId === convId;

              return (
                <button
                  key={convId}
                  type="button"
                  onClick={() => handleSelectConversation(convId)}
                  className={cn(
                    'w-full rounded-xl px-3 py-2 text-left text-xs transition',
                    'hover:bg-muted',
                    isActive && 'bg-muted border border-primary/50',
                  )}
                >
                  <div className="font-semibold truncate">
                    {other || 'Conversation'}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                    {preview}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ---------- RIGHT: SELECTED CONVERSATION / EMPTY STATE ---------- */}
        <main className="flex-1 rounded-2xl border bg-card/80 p-4">
          {!conversationId && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <h1 className="text-lg font-semibold">
                No conversation selected
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Start a conversation from a listing or store, or pick one from
                the list on the left.
              </p>
            </div>
          )}

          {conversationId && !conversation && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <h1 className="text-lg font-semibold">Conversation not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This conversation doesn&apos;t exist or you don&apos;t have
                access.
              </p>
            </div>
          )}

          {conversationId && conversation && (
            <div className="flex h-full flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Conversation
                  </p>
                  <h1 className="text-lg font-semibold">
                    {otherParticipant
                      ? `Chat with ${otherParticipant}`
                      : 'Direct message'}
                  </h1>
                </div>
              </div>

              {/* Messages */}
              <div className="flex min-h-[250px] flex-1 flex-col rounded-2xl border bg-background/60 p-4">
                <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                  {messages && messages.length > 0 ? (
                    messages.map((m: any) => {
                      const isMe = user && m.senderUid === user.uid;
                      return (
                        <div
                          key={m.id}
                          className={cn(
                            'flex',
                            isMe ? 'justify-end' : 'justify-start',
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[70%] rounded-2xl px-3 py-2 text-sm',
                              isMe
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground',
                            )}
                          >
                            {m.text}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No messages yet. Say hi.
                    </p>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <form
                  className="mt-4 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSend();
                  }}
                >
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message…"
                  />
                  <Button type="submit" disabled={sending || !text.trim()}>
                    Send
                  </Button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
