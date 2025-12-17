"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function ISODetail({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [iso, setISO] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ref = doc(db, "iso24", params.id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setISO({ id: snap.id, ...snap.data() });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function closeISO() {
    if (!user || !iso) return;
    if (iso.ownerUid !== user.uid) {
      toast({ title: "Not allowed" });
      return;
    }

    await updateDoc(doc(db, "iso24", iso.id), {
      status: "CLOSED",
      updatedAt: serverTimestamp(),
    });

    toast({ title: "ISO closed" });
    setISO({ ...iso, status: "CLOSED" });
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!iso) return <div className="p-6">Not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">{iso.title}</h1>
      <p>{iso.description}</p>
      <p>Status: {iso.status}</p>

      {user?.uid === iso.ownerUid && iso.status !== "CLOSED" && (
        <Button onClick={closeISO}>Mark as Found</Button>
      )}
    </div>
  );
}
