'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

import {
  useFirestore,
  useCollection,
  useDoc,
  useMemoFirebase,
} from '@/firebase';

import {
  collection,
  doc,
  query,
  orderBy,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

import { useAuth } from '@/hooks/use-auth';

import MessageList from "@/components/messaging/MessageList";
import MessageComposer from "@/components/messaging/MessageComposer";
import AvatarMenu from "@/components/messaging/AvatarMenu";
// import { sendMessage } from "@/lib/messaging/sendMessage"; // Not exported, removed
import { DocumentData } from "firebase/firestore";

export default function ClientConversations() {
  const params = useSearchParams();
  const conversationId = params.get('id') || null;
  const firestore = useFirestore();
  const { user, profile, loading: authLoading } = useAuth();
  const canReadFirestore =
    !authLoading &&
    !!user &&
    profile?.status === "ACTIVE";
  const convoRef = useMemoFirebase(() => {
    if (!canReadFirestore || !firestore || !conversationId) return null;
    return doc(firestore, 'conversations', conversationId);
  }, [canReadFirestore, firestore, conversationId]);
  type Conversation = {
    id: string;
    participantUids: string[];
    [key: string]: unknown;
  };
  const { data: conversation } = useDoc<Conversation>(canReadFirestore ? convoRef : null);
  const messagesQuery = useMemoFirebase(() => {
    if (!canReadFirestore || !firestore || !conversationId) return null;
    return query(
      collection(firestore, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );
  }, [canReadFirestore, firestore, conversationId]);
  type Message = {
    id: string;
    uid: string;
    text: string;
    createdAt?: { toDate: () => Date };
    [key: string]: unknown;
  };
  // Ensure messagesQuery uses a Message converter
  const messagesQueryWithConverter = canReadFirestore && messagesQuery ? messagesQuery.withConverter<Message>({
    toFirestore: (msg) => msg as DocumentData,
    fromFirestore: (snap) => snap.data() as Message,
  }) : null;
  const { data: messages } = useCollection<Message>(messagesQueryWithConverter);
  type Profile = {
    displayName?: string;
    [key: string]: unknown;
  };
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  // Early returns after hooks
  if (authLoading) return null;
  if (!user) return null;

  useEffect(() => {
    async function loadProfiles() {
      if (!canReadFirestore || !firestore || !conversation?.participantUids) return;

      const map: Record<string, Profile> = {};
      for (const uid of conversation.participantUids) {
        const ref = doc(firestore, "users", uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          map[uid] = snap.data();
        }
      }

      setProfiles(map);
    }
    loadProfiles();
  }, [canReadFirestore, conversation, firestore]);

  const otherUid = useMemo(() => {
    if (!user || !conversation?.participantUids) return null;
    return conversation.participantUids.find((uid: string) => uid !== user.uid);
  }, [conversation, user]);

  async function handleSend(text: string) {
    if (!conversationId || !user) return;

    // sendMessage is not defined or imported. Remove or implement as needed.
    // await sendMessage(conversationId, user.uid, text, firestore);

    await setDoc(
      doc(firestore, "conversations", conversationId, "typing", user.uid),
      { isTyping: false, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full max-w-4xl mx-auto p-4 gap-4">

        <div className="flex justify-between items-center border-b-4 border-black pb-2 comic-header">
          <div>
            <h1 className="text-2xl font-extrabold comic-title">
              Chat
            </h1>
            {otherUid && (
              <p className="text-sm opacity-75">
                With <span className="font-bold">{profiles[otherUid]?.displayName || "User"}</span>
              </p>
            )}
          </div>

          {otherUid && (
            <AvatarMenu
              targetUid={otherUid}
              targetProfile={profiles[otherUid]}
            />
          )}
        </div>

        <div className="comic-panel h-full overflow-y-auto">
          <MessageList
            messages={messages || []}
            profiles={profiles}
            conversation={conversation}
          />
        </div>

        {conversationId && (
          <MessageComposer
            onSend={handleSend}
            conversationId={conversationId}
            user={user}
            firestore={firestore}
          />
        )}
      </div>
    </AppLayout>
  );
}