'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
} from 'firebase/firestore';
import type { User, Conversation } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';

export default function NewMessagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const recipientUid = searchParams.get('to');
  const [recipient, setRecipient] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const recipientRef = useMemoFirebase(() => {
    if (!firestore || !recipientUid) return null;
    return doc(firestore, 'users', recipientUid);
  }, [firestore, recipientUid]);

  const { data: recipientData, isLoading: isRecipientLoading } = useDoc<User>(recipientRef);

  useEffect(() => {
    if (recipientData) {
      setRecipient(recipientData);
    }
  }, [recipientData]);

  const handleSendMessage = async () => {
    if (!user || !profile || !recipientUid || !firestore || !messageText.trim()) {
      return;
    }

    setIsSending(true);

    try {
      // Check if a conversation between these two users already exists
      const conversationsRef = collection(firestore, 'conversations');
      const q = query(
        conversationsRef,
        where('participantUids', 'array-contains', user.uid)
      );

      const querySnapshot = await getDocs(q);
      let existingConversation: Conversation | null = null;
      let existingConversationId: string | null = null;

      querySnapshot.forEach((doc) => {
        const conversation = doc.data() as Conversation;
        if (conversation.participantUids.includes(recipientUid)) {
          existingConversation = conversation;
          existingConversationId = doc.id;
        }
      });

      let conversationId: string;

      if (existingConversationId) {
        conversationId = existingConversationId;
      } else {
        // Create a new conversation
        const newConversationRef = await addDoc(conversationsRef, {
          participantUids: [user.uid, recipientUid],
          lastMessageText: messageText.trim(),
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
        conversationId = newConversationRef.id;
        // Also update the doc with its own ID
        await addDoc(collection(firestore, 'conversations', conversationId, 'messages'), {
            senderUid: user.uid,
            text: messageText.trim(),
            createdAt: serverTimestamp(),
            readBy: [user.uid],
        });
      }

      // Add the message to the conversation's subcollection
      const messagesRef = collection(firestore, `conversations/${conversationId}/messages`);
      await addDoc(messagesRef, {
        senderUid: user.uid,
        text: messageText.trim(),
        createdAt: serverTimestamp(),
        readBy: [user.uid],
      });

      toast({
        title: 'Message Sent!',
      });
      
      // Redirect to the now-existing conversation page
      router.push(`/chat?conversationId=${conversationId}`);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message.',
      });
      setIsSending(false);
    }
  };

  if (isRecipientLoading) {
    return <AppLayout><div>Loading...</div></AppLayout>;
  }

  if (!recipient) {
    return (
      <AppLayout>
        <div className="text-center">
            <p>Recipient not found.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border">
                <AvatarImage src={recipient.avatar} alt={recipient.displayName || ''} />
                <AvatarFallback>{getInitials(recipient.displayName)}</AvatarFallback>
              </Avatar>
              <div>
                <CardDescription>New Message To</CardDescription>
                <CardTitle>{recipient.displayName}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Write your message to ${recipient.displayName}...`}
              rows={8}
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleSendMessage} disabled={isSending || !messageText.trim()} className="ml-auto">
              <Send className="mr-2 h-4 w-4" />
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
