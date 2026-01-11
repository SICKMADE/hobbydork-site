'use client';

import { useEffect, useState, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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
import { resolveAvatarUrl } from '@/lib/default-avatar';

import { MessageCircle, ArrowLeft } from 'lucide-react';

type ListingDoc = {
  ownerUid?: string;
  storeId?: string;
  title?: string;
};

type UserDoc = {
  displayName?: string;
  avatar?: string;
};

type ConversationDoc = {
  id?: string;
  participants?: string[];
  participantUids?: string[];
};

export default function ClientNewMessage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  if (authLoading) return null;
  if (!user) return null;
  //
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
    if (!firestore || !user || profile?.status !== "ACTIVE") return;

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
  }, [firestore, user, profile, recipientUidParam, sellerUidParam, listingId]);

  // Load target user's profile for name/avatar
  useEffect(() => {
    if (!firestore || !user || profile?.status !== "ACTIVE" || !targetUid) {
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
  }, [firestore, user, profile, targetUid]);

  const myDisplayName = profile?.displayName || user?.email || 'You';
  const myAvatar = resolveAvatarUrl(profile?.avatar, user?.uid || null);

  const targetDisplayName = targetProfile?.displayName || 'User';
  const targetAvatar = resolveAvatarUrl(targetProfile?.avatar, targetUid);

  const handleSend = async () => {
    if (!firestore || !user || profile?.status !== "ACTIVE" || !targetUid) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    setSending(true);
    try {
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
        const arr = data.participants || data.participantUids || [];
        if (arr.includes(targetUid)) {
          conversationId = docSnap.id;
        }
      });

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
        const convRef = doc(firestore, 'conversations', conversationId);
        await updateDoc(convRef, {
          lastMessageText: trimmed,
          lastMessageSenderUid: user.uid,
          lastMessageAt: serverTimestamp(),
        });
      }

      await addDoc(collection(firestore, 'conversations', conversationId, 'messages'), {
        text: trimmed,
        senderUid: user.uid,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Message sent' });
      router.push(`/messages/${conversationId}`);
    } catch (err: unknown) {
      console.error(err);
      let message = 'Failed to send message';
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
        message = (err as { message: string }).message;
      }
      toast({ title: 'Send failed', description: message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loadingTarget) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <PlaceholderContent title="Start a conversation" description="Loading…" />
      </div>
    );
  }

  return (
      <div className="max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/messages" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New message to {targetDisplayName}</CardTitle>
            <CardDescription>Start a private conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarImage src={targetAvatar} alt={targetDisplayName} />
                <AvatarFallback />
              </Avatar>
              <div className="flex-1">
                <Textarea value={text} onChange={(e) => setText(e.target.value)} />
                <div className="mt-2 flex justify-end">
                  <Button onClick={handleSend} disabled={sending || !text.trim()}>
                    <MessageCircle className="mr-2 h-4 w-4" /> Send
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
