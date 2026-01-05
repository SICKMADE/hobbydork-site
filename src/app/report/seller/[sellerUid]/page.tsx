"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/firebase/client-provider";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function ReportSellerPage({ params }: any) {
  const { sellerUid } = params;
  const { user } = useAuth();
  const router = useRouter();

  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitReport() {
    if (!reason) return alert("Select a reason");

    setLoading(true);

      if (!user) {
        setLoading(false);
        return alert("You must be signed in to submit a report.");
      }

      if (!db) throw new Error('Database not initialized');
      await addDoc(collection(db as any, "reports"), {
        reporterUid: user.uid,
        targetUid: sellerUid,
        context: "seller",
        reason,
        details: details || null,
        createdAt: serverTimestamp(),
        resolved: false,
      });

    setLoading(false);
    router.push("/report/submitted");
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Report Seller</h1>

      <p className="text-gray-700 text-sm">
        Please help keep HobbyDork a safe community.  
        Reports are reviewed by moderators and administrators.
      </p>

      {/* REASON SELECT */}
      <div className="space-y-2">
        <p className="font-semibold">Reason</p>

        <label htmlFor="reason-select" className="sr-only">Reason</label>
        <select
          id="reason-select"
          className="border p-2 rounded w-full"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          title="Reason"
        >
          <option value="">Select a reason…</option>
          <option value="scam">Scam / Fraud Attempt</option>
          <option value="adult_content">Adult Content</option>
          <option value="foul_language">Foul or Abusive Language</option>
          <option value="harassment">Harassment</option>
          <option value="dangerous_behavior">Unsafe Behavior</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* DETAILS TEXTAREA */}
      <div className="space-y-2">
        <p className="font-semibold">Details (optional)</p>
        <textarea
          className="border p-2 rounded w-full h-32 resize-none"
          placeholder="Provide more information if needed…"
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
