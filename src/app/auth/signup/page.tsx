"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Check Firebase initialization
    if (!db || !auth) {
      setError("Database not initialized. Please try again later.");
      setLoading(false);
      return;
    }
    try {
      // Check username uniqueness
      const q = query(collection(db, "user_profiles"), where("username", "==", username));
      const snap = await getDocs(q);
      if (!username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
        setError("Username must be 3-20 characters, letters, numbers, or underscores.");
        return;
      }
      if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
        setError("Invalid email address.");
        return;
      }
      if (snap.size > 0) {
        setError("Username is already taken.");
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);

      await addDoc(collection(db, "user_profiles"), {
        uid: cred.user.uid,
        username,
        email,
        createdAt: new Date(),
        shippingAddress: null,
        isSeller: false,
        verified: false,
      });

      toast({ title: "Signup successful!", description: "Please verify your email." });
      router.push("/verify-email");
    } catch (e: any) {
      setError(e?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 rounded-2xl shadow-xl border bg-card text-card-foreground dark:bg-card dark:text-card-foreground transition-colors">
      <h2 className="text-3xl font-headline font-black mb-6 text-primary dark:text-primary-foreground uppercase tracking-tight">Sign Up</h2>
      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          className="bg-background text-foreground dark:bg-background dark:text-foreground border-input focus-visible:ring-accent"
        />
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="bg-background text-foreground dark:bg-background dark:text-foreground border-input focus-visible:ring-accent"
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
          className="bg-background text-foreground dark:bg-background dark:text-foreground border-input focus-visible:ring-accent"
        />
        {error && <div className="text-destructive font-bold text-sm">{error}</div>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing Up..." : "Sign Up"}
        </Button>
      </form>
    </div>
  );
}
