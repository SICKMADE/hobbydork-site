
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast.tsx';

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
  setDoc,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';

import MessageList from '@/components/messaging/MessageList';
import MessageComposer from '@/components/messaging/MessageComposer';
import AvatarMenu from '@/components/messaging/AvatarMenu';

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params?.id;
  const { user } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const convoRef = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return doc(firestore, "conversations", conversationId);
  }, [firestore, conversationId]);

  const { data: conversation } = useDoc<any>(convoRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return query(
      collection(firestore, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );
  }, [firestore, conversationId]);

  const { data: messages } = useCollection<any>(messagesQuery);

  const [profiles, setProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    async function loadProfiles() {
      if (!conversation?.participantUids) return;

      const map: Record<string, any> = {};
      for (const uid of conversation.participantUids) {
        const uref = doc(firestore, "users", uid);
        const snap = await (await import("firebase/firestore")).getDoc(uref);
        if (snap.exists()) map[uid] = snap.data();
      }
      setProfiles(map);
    }
    if (firestore && conversation) loadProfiles();
  }, [conversation, firestore]);

  const otherUid = useMemo(() => {
    if (!conversation?.participantUids || !user) return null;
    return conversation.participantUids.find((x: string) => x !== user.uid);
  }, [conversation, user]);

  // mark conversation as read
  useEffect(() => {
    if (!conversationId || !user) return;
    setDoc(
      doc(firestore, "conversations", conversationId),
      { lastMessageReadBy: arrayUnion(user.uid) },
      { merge: true }
    );
  }, [conversationId, user, firestore]);

  async function handleSend(text: string) {
    if (!conversationId || !user) return;

    const msgRef = collection(
      firestore,
      "conversations",
      conversationId,
      "messages"
    );

    await setDoc(
      doc(msgRef),
      {
        senderUid: user.uid,
        text,
        createdAt: serverTimestamp(),
      }
    ).catch(() =>
      toast({ title: "Error sending", variant: "destructive" })
    );

    await setDoc(
      doc(firestore, "conversations", conversationId),
      {
        lastMessageText: text,
        lastMessageSenderUid: user.uid,
        lastMessageAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  return (
    <AppLayout>
      <div
        className="flex flex-col w-full h-[calc(100vh-4rem)] p-4 md:p-6"
        style={{ backgroundColor: "#1f1f1f" }}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center pb-4 border-b border-black/40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/messages')}
              className="text-sm font-bold border-2 border-black px-3 py-1 rounded-lg bg-[#ffd84d]"
            >
              ‹ Back
            </button>

            <div>
              <h1 className="text-xl font-extrabold">Chat</h1>
              {otherUid && (
                <p className="text-xs opacity-70">
                  With{" "}
                  <span className="font-bold">
                    {profiles[otherUid]?.displayName || otherUid}
                  </span>
                </p>
              )}
            </div>
          </div>

          {otherUid && (
            <AvatarMenu
              targetUid={otherUid}
              targetProfile={profiles[otherUid]}
            />
          )}
        </div>

        {/* FULL WIDTH CHAT PANEL */}
        <div
          className="flex-1 overflow-y-auto w-full p-4 md:p-6 rounded-xl border-2 border-black"
          style={{ backgroundColor: "#2f2f2f" }}
        >
          <MessageList
            messages={messages || []}
            profiles={profiles}
            conversation={conversation}
          />
        </div>

        {/* COMPOSER */}
        <MessageComposer
          onSend={handleSend}
          conversationId={conversationId}
          user={user}
          firestore={firestore}
        />
      </div>
    </AppLayout>
  );
}
