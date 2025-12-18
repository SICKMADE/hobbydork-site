"use client";

import { useState } from "react";
import { db } from "@/firebase/client-provider";
import { useAuth } from "@/hooks/use-auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function ReportMessageModal({
  open,
  onClose,
  messageId,
  targetUid,
}: any) {
  const { user } = useAuth();

  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function submit() {
    if (!reason) return alert("Choose a reason");

    setLoading(true);

    if (!user) {
      setLoading(false);
      return alert("You must be signed in to submit a report.");
    }

    await addDoc(collection(db, "reports"), {
      reporterUid: user.uid,
      targetUid,
      messageId,
      context: "livechat",
      reason,
      details: details || null,
      createdAt: serverTimestamp(),
      resolved: false,
    });

    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4">

        <h1 className="text-xl font-bold">Report Message</h1>

        {/* Reason */}
        <div>
          <p className="font-semibold">Reason</p>
          <select
            className="border p-2 rounded w-full"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">Select a reason…</option>
            <option value="adult_content">Adult Content</option>
            <option value="foul_language">Foul / Abusive Language</option>
            <option value="harassment">Harassment</option>
            <option value="scam">Scam / Off-Platform Payment</option>
            <option value="spam">Spam</option>
            <option value="dangerous_behavior">Dangerous Behavior</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Details */}
        <div>
          <p className="font-semibold">Details (optional)</p>
          <textarea
            className="border p-2 rounded w-full h-24 resize-none"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Provide additional info…"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}