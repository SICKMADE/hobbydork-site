
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';

import AppLayout from '@/components/layout/AppLayout';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useAuth } from '@/hooks/use-auth';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  useDoc,
} from '@/firebase';

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';

import { Send, Store, MessageCircle, Flag } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import { ReportUserDialog } from '@/components/moderation/ReportUserDialog';

import type { CommunityMessage, User } from '@/lib/types';

type CommunityMessageWithId = CommunityMessage & { id: string };

const MessageItem = ({ message }: { message: CommunityMessageWithId }) => {
  const firestore = useFirestore();
  const [reportOpen, setReportOpen] = useState(false);

  // Guard senderUid so doc() never gets undefined
  const userRef = useMemoFirebase(() => {
    if (!firestore || !message?.senderUid) return null;
    return doc(firestore, 'users', message.senderUid);
  }, [firestore, message?.senderUid]);

  const { data: author } = useDoc<User>(userRef as any);

  const avatarSrc =
    (author as any)?.avatar ||
    (author as any)?.avatarUrl ||
    (author as any)?.photoURL ||
    (author as any)?.profileImageUrl ||
    '';

  const displayName =
    (author as any)?.displayName ||
    message.senderUid ||
    'User';

  const isSeller = !!(author as any)?.isSeller;
  const storeId = (author as any)?.storeId as string | undefined;

  const createdAt =
    (message.createdAt as any as Timestamp | undefined) ?? undefined;

  const timeLabel = createdAt
    ? new Date(createdAt.seconds * 1000).toLocaleTimeString()
    : '…';

  const canViewStore = isSeller && !!storeId;

  return (
    <>
      <div className="flex items-start gap-3 py-2">
        {/* CLICKABLE avatar w/ dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Avatar className="h-12 w-12 border">
                <AvatarImage src={avatarSrc} alt={displayName} />
                <AvatarFallback className="text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40" align="start">
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">
              {displayName}
            </div>
            <DropdownMenuSeparator />
            {canViewStore && (
              <DropdownMenuItem
                asChild
                className="cursor-pointer text-xs"
              >
                <a href={`/store/${storeId}`}>
                  <Store className="mr-2 h-3 w-3" />
                  View store
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              asChild
              className="cursor-pointer text-xs"
            >
              <a href={`/messages/new?recipientUid=${message.senderUid}`}>
                <MessageCircle className="mr-2 h-3 w-3" />
                Message user
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-xs text-red-500 focus:text-red-500"
              onClick={() => setReportOpen(true)}
            >
              <Flag className="mr-2 h-3 w-3" />
              Report user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1 space-y-0.5">
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-[11px] text-muted-foreground">
              {timeLabel}
            </p>
          </div>
          <p className="break-words text-sm text-foreground/90">
            {message.text}
          </p>
        </div>
      </div>

      {/* Report dialog hooked to that user */}
      <ReportUserDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetUid={message.senderUid}
        targetDisplayName={displayName}
        context={{
          source: 'COMMUNITY_CHAT',
          messageId: message.id ?? null,
        }}
      />
    </>
  );
};

export default function ChatPage() {
  const { user, profile } = useAuth();
  const firestore = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);

  const messagesCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'communityMessages');
  }, [firestore]);

  const messagesQuery = useMemoFirebase(() => {
    if (!messagesCollectionRef) return null;
    return query(messagesCollectionRef, orderBy('createdAt', 'asc'));
  }, [messagesCollectionRef]);

  // keep this untyped + cast to dodge TS noise
  const {
    data: rawMessages,
    isLoading,
  } = useCollection(messagesQuery as any);

  const messages: CommunityMessageWithId[] =
    (rawMessages as any as CommunityMessageWithId[]) ?? [];

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !newMessage.trim() ||
      !user ||
      !profile ||
      !messagesCollectionRef
    ) {
      return;
    }

    try {
      const messageData = {
        senderUid: user.uid,
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(messagesCollectionRef, messageData);
      await updateDoc(docRef, { messageId: docRef.id });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

  useEffect(() => {
    if (scrollBottomRef.current) {
      scrollBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <AppLayout>
      {/* Wider on desktop, still full-width on mobile */}
      <div className="flex h-[calc(100vh-4rem)] flex-col px-2 py-2 md:px-6 md:py-4">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col rounded-lg border bg-background">
          {/* Header */}
          <div className="border-b px-4 py-3">
            <h1 className="text-base font-semibold">Community Chat</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Hang out with other collectors. Be cool or be gone.
            </p>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-1.5 text-sm">
              {isLoading && (
                <p className="text-xs text-muted-foreground">
                  Loading messages…
                </p>
              )}

              {messages.map((msg) => (
                <MessageItem key={msg.id} message={msg} />
              ))}

              <div ref={scrollBottomRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t px-4 py-3">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                autoComplete="off"
                disabled={!user || !profile}
                className="text-sm"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newMessage.trim() || !user || !profile}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
