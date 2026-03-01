'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Send, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft,
  Bug,
  ShieldAlert,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function ReportIssuePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsEnded] = useState(false);
  
  const [type, setType] = useState('Bug');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setIsSubmitting(true);

    const reportData = {
      reporterUid: user?.uid || 'anonymous',
      reporterName: user?.displayName || 'Anonymous User',
      reportedName: `System Issue: ${subject}`,
      reason: type,
      details: description,
      type: 'System',
      status: 'PENDING',
      timestamp: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'reports'), reportData);
      setIsEnded(true);
      toast({ title: "Report Received", description: "Our team has been alerted." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Submission Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto space-y-8 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-100 rounded-[2.5rem] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-headline font-black uppercase italic">Report Filed</h1>
              <p className="text-muted-foreground font-medium">Thank you for helping us maintain hobbydork. Our staff will investigate this issue immediately.</p>
            </div>
            <Button asChild className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest">
              <Link href="/help">Return to Help Center</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <Link href="/help" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 font-black uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Help
        </Link>

        <header className="mb-12 space-y-2">
          <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
            <ShieldAlert className="w-3 h-3" /> System Support
          </div>
          <h1 className="text-4xl font-headline font-black uppercase italic tracking-tighter">Report Issue</h1>
          <p className="text-muted-foreground font-medium">Encountered a bug or suspicious behavior? Let us know.</p>
        </header>

        <div className="grid md:grid-cols-[1fr_300px] gap-12">
          <Card className="border-none shadow-2xl bg-card rounded-[2rem] overflow-hidden">
            <CardContent className="p-8 md:p-10 space-y-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Issue Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-bold text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bug">Technical Bug / Error</SelectItem>
                      <SelectItem value="Harassment">User Harassment</SelectItem>
                      <SelectItem value="Fraud">Suspicious Activity / Fraud</SelectItem>
                      <SelectItem value="Feedback">Feature Request / Feedback</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subject</Label>
                  <Input 
                    placeholder="Short summary of the issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="h-14 rounded-2xl border-2 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Detailed Description</Label>
                  <Textarea 
                    placeholder="Please provide as much detail as possible..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="min-h-[200px] rounded-2xl border-2 font-medium"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || !subject || !description}
                  className="w-full h-16 bg-accent text-white font-black text-xl rounded-2xl shadow-xl shadow-accent/20 uppercase italic tracking-tighter transition-all active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <div className="flex items-center gap-3">
                      <Send className="w-5 h-5" />
                      Submit Report
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <aside className="space-y-6">
            <div className="bg-zinc-950 text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-24">
              <h3 className="font-headline font-black text-xl mb-6 uppercase italic tracking-tighter flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" /> Guidelines
              </h3>
              <ul className="space-y-8">
                <li className="space-y-2">
                  <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase">
                    <Bug className="w-3 h-3" /> Bugs
                  </div>
                  <p className="text-[11px] font-bold leading-relaxed text-white/60">
                    Include steps to reproduce the error and your device type if possible.
                  </p>
                </li>
                <li className="space-y-2">
                  <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase">
                    <ShieldAlert className="w-3 h-3" /> Safety
                  </div>
                  <p className="text-[11px] font-bold leading-relaxed text-white/60">
                    For immediate threats or severe harassment, use the harassment tag for high-priority routing.
                  </p>
                </li>
                <li className="space-y-2">
                  <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase">
                    <MessageSquare className="w-3 h-3" /> Feedback
                  </div>
                  <p className="text-[11px] font-bold leading-relaxed text-white/60">
                    We listen to the community. Your feedback directly shapes future hobbydork updates.
                  </p>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
