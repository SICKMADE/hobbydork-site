'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  MessageSquare, 
  Gavel, 
  ShieldCheck, 
  Trash2, 
  CheckCircle2, 
  Clock,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  writeBatch 
} from 'firebase/firestore';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function NotificationsCenter() {
  const { user, isUserLoading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);

  // Security Rule Alignment: Notifications are sub-collection /users/{userId}/notifications
  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('timestamp', 'desc')
    );
  }, [db, user?.uid]);

  const { data: notifications, isLoading } = useCollection(notificationsQuery);

  const handleMarkAsRead = async (id: string) => {
    if (!db || !user) return;
    const ref = doc(db, 'users', user.uid, 'notifications', id);
    await updateDoc(ref, { read: true });
  };

  const handleClearAll = async () => {
    if (!db || !user || !notifications || !notifications.length) return;
    setIsClearing(true);
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        batch.delete(doc(db, 'users', user.uid, 'notifications', notif.id));
      });
      await batch.commit();
      toast({ title: "Inbox Cleared", description: "All notifications have been removed." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Clear Failed" });
    } finally {
      setIsClearing(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Message': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'Outbid': return <Gavel className="w-5 h-5 text-red-500" />;
      case 'System': return <ShieldCheck className="w-5 h-5 text-accent" />;
      default: return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
              <Bell className="w-3 h-3" /> Activity Feed
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black italic tracking-tighter uppercase">Notifications</h1>
            <p className="text-muted-foreground font-medium">Stay updated on your auctions, messages, and order status.</p>
          </div>
          {notifications && notifications.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleClearAll}
              disabled={isClearing}
              className="rounded-full border-2 font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
            >
              {isClearing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Clear All History
            </Button>
          )}
        </header>

        <div className="space-y-4">
          {isLoading ? (
            <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-accent" /></div>
          ) : !user ? (
            <Card className="border-none shadow-sm bg-muted/20 p-20 text-center rounded-[2rem] border-2 border-dashed">
              <p className="font-black uppercase text-muted-foreground tracking-widest">Sign in to view your activity</p>
            </Card>
          ) : !notifications || notifications.length === 0 ? (
            <Card className="border-none shadow-sm bg-muted/20 p-20 text-center rounded-[2rem] border-2 border-dashed">
              <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-black uppercase">All Caught Up</h3>
              <p className="text-muted-foreground font-bold italic mt-2">No new alerts at this time.</p>
            </Card>
          ) : (
            notifications.map((notif) => (
              <Card 
                key={notif.id} 
                className={cn(
                  "premium-card border-none shadow-md overflow-hidden transition-all group",
                  notif.read ? "bg-card opacity-70" : "bg-white border-l-4 border-l-accent ring-1 ring-accent/5"
                )}
              >
                <div className="flex items-center gap-6 p-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-110",
                    notif.read ? "bg-muted/50" : "bg-accent/5 border-accent/10"
                  )}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-[0.2em] h-5">
                        {notif.type}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notif.timestamp?.toDate ? new Date(notif.timestamp.toDate()).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm font-bold leading-tight",
                      notif.read ? "text-muted-foreground" : "text-primary"
                    )}>
                      {notif.text}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {notif.link && (
                      <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 hover:text-accent">
                        <Link href={notif.link} onClick={() => handleMarkAsRead(notif.id)}>
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </Button>
                    )}
                    {!notif.read && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="rounded-full hover:bg-green-50 hover:text-green-600"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
