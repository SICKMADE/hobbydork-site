'use client';

import AppLayout from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth";
import { Send } from "lucide-react";
import { useState } from "react";

// Mock messages for UI purposes
const mockMessages = [
    {
        id: 'msg-1',
        userId: 'user-1',
        userName: 'Active Andy',
        userAvatar: 'https://picsum.photos/seed/user1/100/100',
        text: 'Just listed a holographic Charizard, first edition! Check it out.',
        timestamp: '10:30 AM'
    },
    {
        id: 'msg-2',
        userId: 'user-2',
        userName: 'Limited Lisa',
        userAvatar: 'https://picsum.photos/seed/user2/100/100',
        text: 'Wow, that\'s a big one! Looking for any vintage Star Wars figures?',
        timestamp: '10:32 AM'
    },
    {
        id: 'msg-3',
        userId: 'user-1',
        userName: 'Active Andy',
        userAvatar: 'https://picsum.photos/seed/user1/100/100',
        text: 'Always! Especially Kenner originals. My store is Galactic Treasures if you want to message me directly.',
        timestamp: '10:33 AM'
    }
];


export default function ChatPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState(mockMessages);
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user) return;

        const message = {
            id: `msg-${Date.now()}`,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            text: newMessage.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, message]);
        setNewMessage('');
    }

    return (
        <AppLayout>
            <div className="flex flex-col h-[calc(100vh-10rem)] bg-card border rounded-lg">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-semibold">Community Chat</h1>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className="flex items-start gap-3">
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={msg.userAvatar} alt={msg.userName} />
                                    <AvatarFallback>{msg.userName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <p className="font-semibold">{msg.userName}</p>
                                        <p className="text-xs text-muted-foreground">{msg.timestamp}</p>
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
                        />
                        <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}