'use client';

import { useEffect, useState, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import PlaceholderContent from '@/components/PlaceholderContent';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import { useFirestore } from '@/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  query,
  where,
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
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';

import { MessageCircle, ArrowLeft } from 'lucide-react';

type ListingDoc = {
  ownerUid?: string;
  storeId?: string;
  title?: string;
};

type UserDoc = {
  displayName?: string;
  avatarUrl?: string;
};

type ConversationDoc = {
  id?: string;
  participants?: string[];
  participantUids?: string[];
};

export default function NewMessagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const [targetUid, setTargetUid] = useState<string | null>(null);
  const [targetProfile, setTargetProfile] = useState<UserDoc | null>(null);
  const [loadingTarget, setLoadingTarget] = useState(false);

  const recipientUidParam = searchParams.get('recipientUid');
  const sellerUidParam = searchParams.get('sellerUid');
  const listingId = searchParams.get('listingId');
  const storeIdParam = searchParams.get('storeId');

  // Decide who we are messaging
  useEffect(() => {
    if (!firestore) return;

    // Priority: explicit recipientUid > sellerUid > owner of listing
    if (recipientUidParam) {
      setTargetUid(recipientUidParam);
      return;
    }

    if (sellerUidParam) {
      setTargetUid(sellerUidParam);
      return;
    }

    if (!listingId) {
      setTargetUid(null);
      return;
    }

    let cancelled = false;

    const loadSellerFromListing = async () => {
      setLoadingTarget(true);
      try {
        const ref = doc(firestore, 'listings', listingId);
        const snap = await getDoc(ref);
        if (cancelled) return;

        if (snap.exists()) {
          const data = snap.data() as ListingDoc;
          setTargetUid(data.ownerUid ?? null);
        } else {
          setTargetUid(null);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setTargetUid(null);
      } finally {
        if (!cancelled) setLoadingTarget(false);
      }
    };

    loadSellerFromListing();

    return () => {
      cancelled = true;
    };
  }, [firestore, recipientUidParam, sellerUidParam, listingId]);

  // Load target user's profile for name/avatar
  useEffect(() => {
    if (!firestore || !targetUid) {
      setTargetProfile(null);
      return;
    }

    let cancelled = false;

    const loadUser = async () => {
      setLoadingTarget(true);
      try {
        const ref = doc(firestore, 'users', targetUid);
        const snap = await getDoc(ref);
        if (cancelled) return;

        if (snap.exists()) {
          setTargetProfile(snap.data() as UserDoc);
        } else {
          setTargetProfile(null);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setTargetProfile(null);
      } finally {
        if (!cancelled) setLoadingTarget(false);
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [firestore, targetUid]);

  const myDisplayName =
    (profile as any)?.displayName || user?.email || 'You';
  const myAvatar = (profile as any)?.avatarUrl || '';

  const targetDisplayName =
    targetProfile?.displayName || 'User';
  const targetAvatar = targetProfile?.avatarUrl || '';

  const handleSend = async () => {
    if (!firestore || !user || !targetUid) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      // 1. See if a conversation between these two users already exists
      let conversationId: string | null = null;

      const snap = await getDocs(
        query(
          collection(firestore, 'conversations'),
          where('participantUids', 'array-contains', user.uid),
        ),
      );

      snap.forEach((docSnap) => {
        if (conversationId) return;
        const data = docSnap.data() as ConversationDoc;
        const arr =
          data.participants || data.participantUids || [];
        if (arr.includes(targetUid)) {
          conversationId = docSnap.id;
        }
      });

      // 2. If none exists, create a new conversation
      if (!conversationId) {
        const convRef = await addDoc(
          collection(firestore, 'conversations'),
          {
            participantUids: [user.uid, targetUid],
            participants: [user.uid, targetUid],
            participantDisplayNames: {
              [user.uid]: myDisplayName,
              [targetUid]: targetDisplayName,
            },
            participantAvatarUrls: {
              [user.uid]: myAvatar,
              [targetUid]: targetAvatar,
            },
            storeId: storeIdParam || null,
            listingId: listingId || null,
            lastMessageText: trimmed,
            lastMessageSenderUid: user.uid,
            lastMessageAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
        );
        conversationId = convRef.id;
      } else {
        // Conversation exists: update last message summary
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
      }

      // 3. Add the message to the messages subcollection
      await addDoc(
        collection(
          firestore,
          'conversations',
          conversationId!,
          'messages',
        ),
        {
          senderUid: user.uid,
          text: trimmed,
          createdAt: serverTimestamp(),
        },
      );

      // 4. Go to the conversation thread
      router.replace(`/messages/${conversationId}`);
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

  // Loading
  if (authLoading || loadingTarget) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6">
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Loading…
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Sign in to send messages"
          description="You need to be logged in to message other users."
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

  // No target user could be resolved
  if (!targetUid) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Invalid conversation"
          description="No recipient was provided for this message."
        >
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link href="/messages">Go to messages</Link>
            </Button>
          </div>
        </PlaceholderContent>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="icon"
            className="mr-1"
            onClick={() => router.push('/messages')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarImage src={targetAvatar} />
            <AvatarFallback>
              {targetDisplayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-sm font-semibold">
              New message to {targetDisplayName}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              This conversation will show up in your Messages.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">
                Message {targetDisplayName}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Ask a question about an item, shipping, or just say
              hi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={4}
              className="text-sm"
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
              >
                {sending ? 'Sending…' : 'Send message'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
