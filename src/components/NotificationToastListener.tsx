'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Bell, MessageSquare, Gavel } from 'lucide-react';
import React from 'react';

/**
 * Global component that listens for new unread notifications and triggers toasts.
 * Placed in MainLayoutWrapper to ensure persistent background monitoring.
 */
export function NotificationToastListener() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const lastProcessedId = useRef<string | null>(null);

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'notifications'),
      where('read', '==', false),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [db, user?.uid]);

  const { data: notifications } = useCollection(notificationsQuery);

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    
    const latest = notifications[0];
    
    // Only toast if it's a new ID we haven't processed in this session
    if (latest.id !== lastProcessedId.current) {
      lastProcessedId.current = latest.id;

      const getIcon = (type: string) => {
        switch (type) {
          case 'Message': return <MessageSquare className="w-4 h-4 text-blue-500" />;
          case 'Outbid': return <Gavel className="w-4 h-4 text-red-500" />;
          default: return <Bell className="w-4 h-4 text-accent" />;
        }
      };

      toast({
        title: latest.type || 'New Alert',
        description: latest.text || 'You have a new notification.',
        action: latest.link ? (
          <button 
            onClick={() => window.location.href = latest.link}
            className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline"
          >
            View
          </button>
        ) : undefined
      });
    }
  }, [notifications, toast]);

  return null;
}
