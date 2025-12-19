"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/firebase/client-provider";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { useAuth } from "@/hooks/use-auth";
import AvatarMenu from "./AvatarMenu"; // your menu component
import ReportMessageModal from "./ReportMessageModal";
import { getDefaultAvatarUrl } from "@/lib/default-avatar";

type Message = {
  id: string;
  text: string;
  senderUid: string;
  createdAt?: { toDate: () => Date } | Date | null;
};
type MenuOpen = { uid: string; messageId: string } | null;
type ReportModal = { open: boolean; uid: string | null; id: string | null };

export default function LiveChat() {
  const { user, userData } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState<MenuOpen>(null);
  const [reportModal, setReportModal] = useState<ReportModal>({ open: false, uid: null, id: null });

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load messages
  useEffect(() => {
    const q = query(
      collection(db, "groupChat"),
      orderBy("createdAt", "asc"),
      limit(400)
    );

    let unsub: (() => void) | undefined = undefined;
    try {
      unsub = onSnapshot(q, (snap) => {
        setMessages(
          snap.docs.map((d) => {
            const data = d.data() as Partial<Message>;
            return {
              id: d.id,
              text: data.text ?? "",
              senderUid: data.senderUid ?? "",
              createdAt: data.createdAt ?? null,
            };
          })
        );
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      });
    } catch (err) {
      console.error('LiveChat: onSnapshot failed', err);
    }

    return () => {
      try {
        if (typeof unsub === 'function') unsub();
      } catch (e) {
        console.warn('LiveChat: error during unsubscribe', e);
      }
    };
  }, []);

  async function sendMessage(): Promise<void> {
    if (!input.trim()) return;

    if (userData?.status === "SUSPENDED") {
      alert("You are suspended and cannot send messages.");
      return;
    }

    if (!user) return alert("Please sign in to send a message.");

    await addDoc(collection(db, "groupChat"), {
      text: input,
      senderUid: user.uid,
      createdAt: serverTimestamp(),
    });

    setInput("");
  }


  // Accept any type for role to resolve TS error from dynamic data
  function roleStyle(role: any) {
    if (role === "ADMIN") return "text-yellow-500 font-bold";
    if (role === "MODERATOR") return "text-lime-500 font-semibold";
    if (role === "SELLER") return "text-blue-500";
    return "text-gray-800";
  }


  // Accept any type for role to resolve TS error from dynamic data
  function roleIcon(role: any) {
    if (role === "ADMIN") return "👑";
    if (role === "MODERATOR") return "🛡️";
    return "";
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto p-4">

      {/* LEFT: MESSAGES */}
      <div className="col-span-2 flex flex-col h-[80vh] border rounded bg-white shadow">

        {/* SAFETY BANNER */}
        <div className="bg-blue-100 text-center text-xs text-blue-900 p-2 border-b">
          No adult content. No foul language. No harassment. No off-platform payments.
        </div>

        {/* MESSAGE LIST */}
        <div className="flex-1 p-3 overflow-y-auto space-y-4">

          {messages.map((m) => {
            const uid = user?.uid ?? null;
            const ownerRole = m.senderUid === uid ? userData?.role : null;
            const isSelf = m.senderUid === uid;

            return (
              <div key={m.id} className="flex gap-2 items-start relative">

                {/* Avatar */}
                <img
                  src={getDefaultAvatarUrl(m.senderUid)}
                  className="w-10 h-10 rounded-full cursor-pointer"
                  onClick={() =>
                    setMenuOpen({ uid: m.senderUid, messageId: m.id })
                  }
                />

                {/* Message bubble */}
                <div
                  className={`p-3 rounded-xl max-w-[75%] shadow ${
                    isSelf
                      ? "bg-green-100 text-black ml-auto"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  {/* USERNAME + ROLE */}
                  <div className="flex items-center gap-1 mb-1">
                    <span className={roleStyle(ownerRole)}>
                      {roleIcon(ownerRole)} {m.senderUid}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(() => {
                        if (!m.createdAt) return null;
                        if (
                          typeof m.createdAt === "object" &&
                          m.createdAt !== null &&
                          "toDate" in m.createdAt &&
                          typeof (m.createdAt as any).toDate === "function"
                        ) {
                          return (m.createdAt as { toDate: () => Date }).toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        }
                        if (m.createdAt instanceof Date) {
                          return m.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        }
                        return null;
                      })()}
                    </span>
                  </div>

                  {/* MESSAGE TEXT */}
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* INPUT BAR */}
        <div className="p-3 border-t flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border rounded p-2"
            placeholder={
              userData.status === "SUSPENDED"
                ? "You are suspended from chatting."
                : "Type a message…"
            }
            disabled={userData.status === "SUSPENDED"}
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={userData.status === "SUSPENDED"}
          >
            Send
          </button>
        </div>
      </div>

      {/* RIGHT: USER LIST (DESKTOP ONLY) */}
      <div className="hidden md:block col-span-1 h-[80vh] border rounded bg-white shadow p-4 overflow-y-auto">
        <p className="font-bold mb-3">Active Users</p>
        {/* You will fill this in Module 22 */}
      </div>

      {/* AVATAR MENU */}
      {menuOpen && (
        <AvatarMenu
          uid={menuOpen.uid}
          messageId={menuOpen.messageId}
          onClose={() => setMenuOpen(null)}
          onReportMessage={() =>
            setReportModal({
              open: true,
              uid: menuOpen.uid,
              id: menuOpen.messageId,
            })
          }
        />
      )}

      {/* REPORT MESSAGE MODAL */}
      <ReportMessageModal
        open={reportModal.open}
        targetUid={reportModal.uid}
        messageId={reportModal.id}
        onClose={() => setReportModal({ open: false, uid: null, id: null })}
      />
    </div>
  );
}
