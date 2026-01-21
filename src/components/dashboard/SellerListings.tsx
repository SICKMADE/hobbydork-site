import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function SellerListings({ sellerUid }: { sellerUid: string }) {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      if (!sellerUid || !db) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, "listings"),
          where("sellerUid", "==", sellerUid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setListings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setListings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, [sellerUid]);

  return (
    <Card className="border-2 border-black bg-card/80 shadow mb-6">
      <CardHeader>
        <CardTitle>Marketplace Listings</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground">Loading listings…</div>
        ) : listings.length === 0 ? (
          <div className="text-muted-foreground">No marketplace listings yet.</div>
        ) : (
          <ul className="space-y-3">
            {listings.map(l => (
              <li key={l.id} className="border rounded p-3 flex justify-between">
                <div>
                  <div className="font-semibold">{l.title}</div>
                  <div className="text-xs text-muted-foreground">Price: ${l.price}</div>
                  <div className="text-xs text-muted-foreground">Status: {l.status}</div>
                </div>
                <Link href={`/listings/${l.id}`} className="underline text-sm">View</Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
