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
import { collection, addDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from "@/firebase/provider";
import type { Chat } from '@/lib/types';


export default function ChatPage() {
    const { user } = useUser();
    const { profile } = useAuth();
    const firestore = useFirestore();
    const [newMessage, setNewMessage] = useState('');
    const scrollAreaViewport = useRef<HTMLDivElement>(null);

    const chatCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'chat');
    }, [firestore]);

    const chatQuery = useMemoFirebase(() => {
        if (!chatCollection) return null;
        return query(chatCollection, orderBy('timestamp', 'asc'));
    }, [chatCollection]);

    const { data: messages, isLoading } = useCollection<Chat>(chatQuery);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || !profile || !chatCollection) return;

        const messageData = {
            userId: user.uid,
            userName: profile.displayName,
            userAvatar: profile.avatar || `https://picsum.photos/seed/${user.uid}/100/100`,
            text: newMessage.trim(),
            timestamp: serverTimestamp()
        };

        try {
            await addDoc(chatCollection, messageData);
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
                            <div key={msg.id} className="flex items-start gap-3">
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={msg.userAvatar} alt={msg.userName} />
                                    <AvatarFallback>{msg.userName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <p className="font-semibold">{msg.userName}</p>
                                        <p className="text-xs text-muted-foreground">
                                           {msg.timestamp ? new Date((msg.timestamp as Timestamp)?.seconds * 1000).toLocaleTimeString() : '...'}
                                        </p>
                                    </div>
                                    <p className="text-foreground/90">{msg.text}</p>
                                </div>
                            </div>
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

    