'use client';

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function MessageList({
  messages,
  profiles,
  conversation,
}: {
  messages: any[];
  profiles: Record<string, any>;
  conversation: any;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto px-2">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.messageId || msg.id}
          message={msg}
          senderProfile={profiles[msg.senderUid] || {}}
          conversation={conversation}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
