"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";

export default function BlindBidderToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      if (!db) return;
      const configRef = doc(db, "config", "blindBidder");
      const configSnap = await getDoc(configRef);
      setEnabled(!!configSnap.data()?.enabled);
      setLoading(false);
    }
    fetchConfig();
  }, []);

  async function toggleEnabled() {
    if (!db) return;
    const configRef = doc(db, "config", "blindBidder");
    await setDoc(configRef, { enabled: !enabled }, { merge: true });
    setEnabled(!enabled);
  }

  return (
    <Button onClick={toggleEnabled} disabled={loading}>
      {enabled ? "Deactivate Blind Bidder" : "Activate Blind Bidder"}
    </Button>
  );
}
