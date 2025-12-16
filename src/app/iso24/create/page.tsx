"use client";

import { useState } from "react";
import { db } from "@/firebase/client-provider";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CreateISO() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  async function makeIso() {
    if (!user) return;
    if (!title.trim()) return;

    await addDoc(collection(db, "iso24"), {
      userId: user.uid,
      title,
      description: desc,
      status: "OPEN",
      createdAt: serverTimestamp(),
    });

    toast({ title: "ISO Created" });
    router.push("/iso24");
  }

  if (!user) return <div className="p-6">Sign in required.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Create ISO</h1>

      <Input
        placeholder="What are you looking for?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Textarea
        rows={4}
        placeholder="Describe your ISO"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />

      <Button onClick={makeIso}>Submit</Button>
    </div>
  );
}
