'use client';

import { useAuth } from "@/hooks/use-auth";
import { getAvatarUrl } from "./avatar-utils";
import { motion } from "framer-motion";

export default function MessageBubble({
  message,
  senderProfile,
  conversation,
}: {
  message: any;
  senderProfile: any;
  conversation: any;
}) {
  const { user } = useAuth();
  const isMe = user?.uid === message.senderUid;

  const readBy = conversation?.lastMessageReadBy || [];
  const isRead = isMe && readBy.includes(message.senderUid);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={`flex mb-3 ${isMe ? "justify-end" : "justify-start"}`}
    >
      {!isMe && (
        <img
          src={getAvatarUrl(senderProfile)}
          alt="Sender avatar"
          className="w-9 h-9 rounded-full mr-2 border-2 border-black shadow-md object-cover comic-avatar-shadow"
        />
      )}

      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl border-2 text-sm leading-snug shadow-md ${
          isMe
            ? "comic-bubble-me text-black"
            : "comic-bubble-them text-black"
        }`}
      >
        {!isMe && senderProfile?.displayName && (
          <div className="font-bold text-xs mb-1 text-black">{senderProfile.displayName}</div>
        )}
        <div>{message.text}</div>
        {isMe && (
          <div className="text-[10px] text-right mt-1 opacity-70">
            {isRead ? "✔✔ Read" : "✔ Sent"}
          </div>
        )}
      </div>

      {isMe && (
        <img
          src={getAvatarUrl(senderProfile)}
          alt="Your avatar"
          className="w-9 h-9 rounded-full ml-2 border-2 border-black shadow-md object-cover comic-avatar-shadow"
        />
      )}
    </motion.div>
  );
}
