import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SellerNotifications({ sellerUid }: { sellerUid: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      if (!sellerUid || !db) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, "users", sellerUid, "notifications"),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const snap = await getDocs(q);
        setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [sellerUid]);

  return (
    <Card className="border-2 border-black bg-card/80 shadow mb-6">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground">Loading notifications…</div>
        ) : notifications.length === 0 ? (
          <div className="text-muted-foreground">No notifications yet.</div>
        ) : (
          <ul className="space-y-2">
            {notifications.map(n => (
              <li key={n.id} className="border rounded p-3 bg-background/80">
                <div className="font-bold">{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.type}</div>
                <div>{n.body}</div>
                <div className="text-xs text-muted-foreground">{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : ""}</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
