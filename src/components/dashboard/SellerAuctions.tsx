import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function SellerAuctions({ sellerUid }: { sellerUid: string }) {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuctions() {
      if (!sellerUid || !db) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, "blindBidderAuctions"),
          where("sellerUid", "==", sellerUid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setAuctions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setAuctions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAuctions();
  }, [sellerUid]);

  return (
    <Card className="border-2 border-black bg-card/80 shadow mb-6">
      <CardHeader>
        <CardTitle>BlindBidder Auctions</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground">Loading auctions…</div>
        ) : auctions.length === 0 ? (
          <div className="text-muted-foreground">No BlindBidder auctions yet.</div>
        ) : (
          <ul className="space-y-3">
            {auctions.map(a => (
              <li key={a.id} className="border rounded p-3 flex justify-between">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-xs text-muted-foreground">Status: {a.status}</div>
                </div>
                <Link href={`/blind-bidder/${a.id}`} className="underline text-sm">View</Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
