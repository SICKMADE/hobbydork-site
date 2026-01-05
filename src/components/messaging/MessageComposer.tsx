'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { User } from "firebase/auth";

export default function MessageComposer({
  onSend,
  conversationId,
  user,
  firestore,
}: {
  onSend: (text: string) => void;
  conversationId: string;
  user: User | null;
  firestore: any;
}) {
  const [text, setText] = useState("");

  async function updateTyping(isTyping: boolean) {
    if (!conversationId || !user || !user.emailVerified) return;

    await setDoc(
      doc(firestore, "conversations", conversationId, "typing", user.uid),
      {
        isTyping,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (!text.trim() || !user) return;

    await onSend(text.trim());
    setText("");
    await updateTyping(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
      <Input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          updateTyping(e.target.value.length > 0);
        }}
        placeholder="Type a message…"
        className="border-2 border-black shadow-sm"
      />

      <Button
        type="submit"
        disabled={!text.trim()}
        className="border-2 border-black shadow comic-button"
      >
        Send
      </Button>
    </form>
  );
}
