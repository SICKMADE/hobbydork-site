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

export default function ReportListingPage({ params }: any) {
  const { listingId } = params;
  const { user } = useAuth();
  const router = useRouter();

  const [sellerUid, setSellerUid] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  // Load listing owner
  useEffect(() => {
    async function loadListing() {
      const snap = await getDoc(doc(db, "listings", listingId));
      if (snap.exists()) {
        const data = snap.data();
        setSellerUid(data.ownerUid);
      }
    }
    loadListing();
  }, [listingId]);

  async function submitReport() {
    if (!reason) return alert("Select a reason");

    setLoading(true);

    await addDoc(collection(db, "reports"), {
      reporterUid: user.uid,
      targetUid: sellerUid,
      listingId,
      context: "listing",
      reason,
      details: details || null,
      createdAt: serverTimestamp(),
      resolved: false,
    });

    setLoading(false);
    router.push("/report/submitted");
  }

  if (!sellerUid) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-bold">Report Listing</h1>

      <p className="text-gray-700 text-sm">
        Thank you for helping keep HobbyDork safe.  
        Adult content, foul language, scams, and misrepresentation are prohibited.
      </p>

      {/* REASON */}
      <div className="space-y-2">
        <p className="font-semibold">Reason</p>

        <select
          className="border p-2 rounded w-full"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="">Select a reason…</option>
          <option value="adult_content">Adult Content</option>
          <option value="foul_language">Foul or Abusive Language</option>
          <option value="scam">Scam / Misrepresentation</option>
          <option value="copyright_violation">Copyright Violation</option>
          <option value="unsafe_item">Unsafe or Prohibited Item</option>
          <option value="harassment">Harassment / Threatening Behavior</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* DETAILS */}
      <div className="space-y-2">
        <p className="font-semibold">Details (optional)</p>
        <textarea
          className="border p-2 rounded w-full h-32 resize-none"
          placeholder="Provide more information if needed…"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </div>

      {/* SUBMIT */}
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
