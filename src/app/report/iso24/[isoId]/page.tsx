"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/firebase/client-provider";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function ReportISO24Page({ params }: any) {
  const { isoId } = params;
  const { user } = useAuth();
  const router = useRouter();

  const [ownerUid, setOwnerUid] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  // Load ISO post to get owner UID
  useEffect(() => {
    async function loadISO() {
      // Strict Firestore read gate (replace with your actual canReadFirestore logic)
      const canReadFirestore = !!user && user.emailVerified;
      if (!canReadFirestore) return;
      if (!db) return;
      const snap = await getDoc(doc(db!, "iso24Posts", isoId));
      if (snap.exists()) {
        const data = snap.data();
        setOwnerUid(data.ownerUid);
      }
    }
    loadISO();
  }, [isoId, user]);

  async function submitReport() {
    if (!reason) return alert("Select a reason");

    setLoading(true);

      if (!user) {
        setLoading(false);
        return alert("You must be signed in to submit a report.");
      }

      if (!db) return;
      await addDoc(collection(db!, "reports"), {
        reporterUid: user.uid,
        targetUid: ownerUid,
        isoId,
        context: "iso24",
        reason,
        details: details || null,
        createdAt: serverTimestamp(),
        resolved: false,
      });

    setLoading(false);
    router.push("/report/submitted");
  }

  if (!ownerUid) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-bold">Report ISO-24 Post</h1>

      <p className="text-gray-700 text-sm">
        ISO-24 posts must follow HobbyDork safety rules.  
        Off-platform payments, adult content, foul language, and scams are prohibited.
      </p>

      {/* REASON SELECT */}
      <div className="space-y-2">
        <p className="font-semibold">Reason</p>

        <select
          className="border p-2 rounded w-full"
          title="Reason for report"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="">Select a reason…</option>
          <option value="adult_content">Adult Content</option>
          <option value="foul_language">Foul or Abusive Language</option>
          <option value="scam">Scam / Fraud Attempt</option>
          <option value="off_platform_payment">
            Off-Platform Payment Request
          </option>
          <option value="unsafe_item">Unsafe or Prohibited Request</option>
          <option value="harassment">Harassment / Threatening Behavior</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* DETAILS TEXTAREA */}
      <div className="space-y-2">
        <p className="font-semibold">Details (optional)</p>

        <textarea
          className="border p-2 rounded w-full h-32 resize-none"
          placeholder="Provide additional information if needed…"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </div>

      {/* SUBMIT BUTTON */}
      <button
        onClick={submitReport}
        disabled={loading}
        className="w-full bg-red-600 text-white py-2 rounded disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit Report"}
      </button>
    </div>
  );
}
