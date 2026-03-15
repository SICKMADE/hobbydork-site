'use client';

import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/lib/mock-data';
import { Search, Sparkles, ArrowLeft, Info, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';

export default function CreateISORequest() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !profile) {
      toast({ variant: 'destructive', title: 'Auth Required', description: 'Sign in to post requests.' });
      return;
    }

    if (!user.emailVerified || profile?.status !== 'ACTIVE') {
      toast({ 
        variant: 'destructive', 
        title: 'Action Restricted', 
        description: 'You must verify your email and have an active profile to post search requests.' 
      });
      return;
    }

    setLoading(true);

    // ALIGNED: Using 'uid' as defined in backend.json ISO24Post entity
    const isoData = {
      title,
      uid: user.uid,
      userName: profile.username || 'Anonymous Collector',
      postedAt: serverTimestamp(),
      category,
      budget: parseFloat(budget),
      description,
      status: 'Searching'
    };

    addDoc(collection(db, 'iso24Posts'), isoData)
      .then(() => {
        toast({ title: "Request Posted!", description: "Your hunt is now live in the ISO24 feed for the next 24 hours." });
        router.push('/iso24');
      })
      .catch(async (error) => {
        toast({
          variant: 'destructive',
          title: 'Request Failed',
          description: getFriendlyErrorMessage(error)
        });
        const permissionError = new FirestorePermissionError({
          path: 'iso24Posts',
          operation: 'create',
          requestResourceData: isoData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Link href="/iso24" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 font-black uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </Link>

          <header className="mb-10 space-y-2">
            <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase mb-2">
              <Clock className="w-3 h-3" /> 24-Hour Active Search
            </div>
            <h1 className="text-4xl font-headline font-black italic tracking-tighter uppercase leading-none">Post ISO Request</h1>
            <p className="text-muted-foreground font-medium">What item are you hunting for today?</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest">Item Name</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. 1978 Luke Skywalker Orange Hair Variant" 
                  required 
                  className="h-14 rounded-2xl border-2 font-bold"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest">Category</Label>
                  <Select onValueChange={setCategory} value={category} required>
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-bold">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-[10px] font-black uppercase tracking-widest">Max Budget</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">$</span>
                    <Input 
                      id="budget" 
                      type="number" 
                      className="pl-8 h-14 rounded-2xl border-2 font-bold" 
                      placeholder="0.00" 
                      required 
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest">Specific Requirements</Label>
                <Textarea 
                  id="description" 
                  placeholder="Detail the condition, grading, or specific provenance you need..."
                  className="min-h-[150px] rounded-2xl border-2 font-medium"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-accent/5 border-2 border-dashed border-accent/20 p-8 rounded-[2.5rem] flex gap-4">
              <Info className="w-6 h-6 text-accent shrink-0 mt-1" />
              <div className="text-xs space-y-2 leading-relaxed font-bold">
                <p className="font-black text-accent uppercase tracking-widest">How it works</p>
                <p className="text-muted-foreground italic">Your request will be live for <span className="text-primary font-black">24 hours</span>. Sellers and other collectors will contact you directly via secure messaging. If you haven't found your item after a day, you can always repost your search.</p>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-20 bg-red-600 dark:bg-red-600 text-white font-black text-2xl rounded-2xl shadow-2xl transition-all active:scale-95 uppercase italic tracking-tighter hover:bg-red-700 dark:hover:bg-red-700"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Posting Search...
                </div>
              ) : "Post Request to ISO24 Feed"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
