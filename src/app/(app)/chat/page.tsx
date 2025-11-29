
'use client';

import AppLayout from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, serverTimestamp, query, orderBy, Timestamp, doc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import type { CommunityMessage, User } from '@/lib/types';


const MessageItem = ({ message }: { message: CommunityMessage & { id: string } }) => {
    const firestore = useFirestore();

    const userRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'users', message.senderUid);
    }, [firestore, message.senderUid]);

    const { data: user } = useDoc<User>(userRef);

    return (
        <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border">
                <AvatarImage src={user?.avatar} alt={user?.displayName || 'User'} />
                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-baseline gap-2">
                    <p className="font-semibold">{user?.displayName || 'Loading...'}</p>
                    <p className="text-xs text-muted-foreground">
                        {message.createdAt ? new Date((message.createdAt as Timestamp)?.seconds * 1000).toLocaleTimeString() : '...'}
                    </p>
                </div>
                <p className="text-foreground/90">{message.text}</p>
            </div>
        </div>
    );
};


export default function ChatPage() {
    const { user } = useUser();
    const { profile } = useAuth();
    const firestore = useFirestore();
    const [newMessage, setNewMessage] = useState('');
    const scrollAreaViewport = useRef<HTMLDivElement>(null);

    const messagesCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'communityMessages');
    }, [firestore]);

    const messagesQuery = useMemoFirebase(() => {
        if (!messagesCollectionRef) return null;
        return query(messagesCollectionRef, orderBy('createdAt', 'asc'));
    }, [messagesCollectionRef]);

    const { data: messages, isLoading } = useCollection<CommunityMessage>(messagesQuery);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || !profile || !messagesCollectionRef) return;

        const messageData = {
            senderUid: user.uid,
            text: newMessage.trim(),
            createdAt: serverTimestamp()
        };

        try {
            const docRef = await addDoc(messagesCollectionRef, messageData);
            // The messageId is now the document ID. We can add it to the document if we need it.
            // await updateDoc(docRef, { messageId: docRef.id });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    }

    useEffect(() => {
        if (scrollAreaViewport.current) {
            scrollAreaViewport.current.scrollTo({
                top: scrollAreaViewport.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    return (
        <AppLayout>
            <div className="flex flex-col h-[calc(100vh-8rem)] bg-card border rounded-lg">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-semibold">Community Chat</h1>
                </div>

                <ScrollArea className="flex-1 p-4" viewportRef={scrollAreaViewport}>
                    <div className="space-y-4">
                        {isLoading && <p>Loading messages...</p>}
                        {messages && messages.map((msg) => (
                            <MessageItem key={msg.id} message={msg} />
                        ))}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            autoComplete="off"
                            disabled={!user || !profile}
                        />
                        <Button type="submit" size="icon" disabled={!newMessage.trim() || !user || !profile}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

    