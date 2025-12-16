"use client";

import { useAuth } from "@/hooks/use-auth";
import { db } from "@/firebase/client-provider";
import {
  deleteDoc,
  doc,
  query,
  collection,
  where,
  getDocs,
  writeBatch,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function AvatarMenu({
  uid,
  messageId,
  onClose,
  onReportMessage,
}: any) {
  const { user, userData } = useAuth();

  if (!uid || !onClose) return null;

  const isAdmin = userData.role === "ADMIN";
  const isMod = userData.role === "MODERATOR";

  async function deleteMessage() {
    await deleteDoc(doc(db, "groupChat", messageId));
    onClose();
  }

  async function deleteAllMessagesFromUser() {
    const q = query(
      collection(db, "groupChat"),
      where("senderUid", "==", uid)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    onClose();
  }

  async function suspendUser(hours: number) {
    const until = new Date(Date.now() + hours * 60 * 60 * 1000);
    await updateDoc(doc(db, "users", uid), {
      status: "SUSPENDED",
      suspendUntil: until,
    });
    onClose();
  }

  async function banUser() {
    await updateDoc(doc(db, "users", uid), {
      status: "BANNED",
      banTime: serverTimestamp(),
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30"
      onClick={onClose}
    >
      <div
        className="absolute bg-white rounded shadow p-2 w-48 right-4 top-20"
        onClick={(e) => e.stopPropagation()}
      >

        {/* UNIVERSAL OPTIONS */}
        <button
          onClick={() => { window.location.href = `/store/${uid}`; }}
          className="w-full text-left px-3 py-2 hover:bg-gray-100"
        >
          View Store
        </button>

        <button
          onClick={() => { window.location.href = `/messages/${uid}`; }}
          className="w-full text-left px-3 py-2 hover:bg-gray-100"
        >
          Send Message
        </button>

        <button
          onClick={() => { window.location.href = `/report/user/${uid}`; }}
          className="w-full text-left px-3 py-2 hover:bg-gray-100"
        >
          Report User
        </button>

        <button
          onClick={onReportMessage}
          className="w-full text-left px-3 py-2 hover:bg-gray-100"
        >
          Report Message
        </button>

        {/* MODERATOR CONTROLS */}
        {(isAdmin || isMod) && (
          <>
            <div className="border-t my-2" />

            <button
              onClick={deleteMessage}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
            >
              Delete Message
            </button>

            <button
              onClick={() => suspendUser(24)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
            >
              Suspend 24 Hours
            </button>

            <button
              onClick={() => suspendUser(72)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
            >
              Suspend 3 Days
            </button>
          </>
        )}

        {/* ADMIN-ONLY CONTROLS */}
        {isAdmin && (
          <>
            <button
              onClick={() => suspendUser(168)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-700"
            >
              Suspend 7 Days
            </button>

            <button
              onClick={deleteAllMessagesFromUser}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-700"
            >
              Delete All Messages
            </button>

            <div className="border-t my-2" />

            <button
              onClick={banUser}
              className="w-full text-left px-3 py-2 hover:bg-gray-200 text-red-800 font-bold"
            >
              BAN USER
            </button>
          </>
        )}
      </div>
    </div>
  );
}
