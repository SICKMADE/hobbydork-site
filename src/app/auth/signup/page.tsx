"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc, writeBatch } from "firebase/firestore";
import { Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { getRandomAvatar, filterProfanity } from "@/lib/utils";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    if (!agreedToTerms) {
      setError("You must certify your age and agree to the terms.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      setError("Handle must be at least 3 characters.");
      return;
    }

    const filtered = filterProfanity(cleanUsername);
    if (filtered.includes('*')) {
      setError("Forbidden language in handle. Choose another.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Step 1: Check Username Uniqueness
      const usernameRef = doc(db, 'usernames', cleanUsername);
      const usernameSnap = await getDoc(usernameRef);
      
      if (usernameSnap.exists()) {
        setError("This handle is already taken.");
        setLoading(false);
        return;
      }

      // Step 2: Create Auth Account
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Step 3: Atomic Sync (User Doc + Username Reservation)
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', cred.user.uid);
      const photoURL = getRandomAvatar(cred.user.uid);

      batch.set(userRef, {
        uid: cred.user.uid,
        username: cleanUsername,
        storeId: cleanUsername, // Identity Lock: Username is the StoreID
        email: email.toLowerCase(),
        photoURL,
        status: 'ACTIVE',
        role: 'USER',
        isSeller: false,
        emailVerified: false,
        agreedToTerms: true,
        isOfAge: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      batch.set(usernameRef, { uid: cred.user.uid });

      await batch.commit();
      
      // Step 4: Send Verification
      await sendEmailVerification(cred.user);

      toast({ 
        title: "Account Created", 
        description: "Welcome @"+cleanUsername+". Please verify your email to begin trading." 
      });
      
      router.push("/verify-email");
    } catch (e: any) {
      setError(e?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 rounded-[2rem] shadow-2xl border bg-card text-card-foreground">
      <div className="text-center mb-8 space-y-2">
        <h2 className="text-3xl font-headline font-black text-primary uppercase tracking-tight italic">Sign Up</h2>
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Join the Collector Network</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="signup-username-input" className="text-[10px] font-black uppercase tracking-widest ml-1">Choose Handle</Label>
          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="signup-username-input"
              name="username"
              placeholder="username"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              required
              className="pl-11 h-12 bg-background border-2 rounded-xl focus-visible:ring-primary font-bold"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email-input" className="text-[10px] font-black uppercase tracking-widest ml-1">Email</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="signup-email-input"
              name="email"
              placeholder="email@example.com"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="pl-11 h-12 bg-background border-2 rounded-xl focus-visible:ring-primary font-medium"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="signup-password-input" className="text-[10px] font-black uppercase tracking-widest ml-1">Password</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="signup-password-input"
              name="password"
              placeholder="Min 6 characters"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              className="pl-11 h-12 bg-background border-2 rounded-xl focus-visible:ring-primary font-medium"
            />
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl border border-dashed border-zinc-300">
          <Checkbox 
            id="standalone-age-check" 
            checked={agreedToTerms} 
            onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label htmlFor="standalone-age-check" className="text-[10px] font-black uppercase leading-tight cursor-pointer">
              I certify that I am 18 years of age or older.
            </Label>
            <p className="text-[9px] text-muted-foreground leading-tight">
              By joining, you agree to our <Link href="/terms" className="text-primary underline">Terms of Service</Link>.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 font-bold text-xs animate-in shake-in">
            {error}
          </div>
        )}
        
        <Button 
          type="submit" 
          disabled={loading || !agreedToTerms} 
          className="w-full h-14 bg-primary text-primary-foreground font-black uppercase rounded-xl shadow-xl hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Sign Up"}
        </Button>
      </form>

      <p className="mt-8 text-center text-[10px] font-black uppercase text-zinc-400 tracking-widest">
        hobbydork secure access node
      </p>
    </div>
  );
}
