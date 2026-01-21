import { useEffect, useState } from "react";
import { useState as useReactState } from "react";
import { db } from "@/firebase/client-provider";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SellerPerformance({ sellerUid }: { sellerUid: string }) {
  const [showModal, setShowModal] = useReactState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      if (!sellerUid || !db) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, "reviews"),
          where("sellerUid", "==", sellerUid),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const snap = await getDocs(q);
        setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [sellerUid]);

  // Calculate average rating
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(2) : null;

  // Example sales tips
  const tips = [
    "Respond quickly to buyer messages.",
    "Ship items promptly and provide tracking.",
    "Maintain high-quality listings with clear photos.",
    "Request feedback after each sale.",
    "Resolve disputes professionally.",
  ];

  return (
    <Card className="border-2 border-black bg-card/80 shadow mb-6">
      <CardHeader>
        <CardTitle>Seller Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground">Loading reviews…</div>
        ) : (
          <>
            <div className="mb-2">
              <span className="font-semibold">Average Rating:</span>{" "}
              {avgRating ? (
                <button
                  className="text-primary underline font-bold cursor-pointer"
                  onClick={() => setShowModal(true)}
                  title="View all reviews"
                >
                  {avgRating} / 5
                </button>
              ) : "No ratings yet"}
            </div>
            <div className="mb-2 font-semibold">Recent Reviews:</div>
            {reviews.length === 0 ? (
              <div className="text-muted-foreground">No reviews yet.</div>
            ) : (
              <ul className="space-y-2 mb-4">
                {reviews.slice(0, 3).map(r => (
                  <li key={r.id} className="border rounded p-3 bg-background/80">
                    <div className="font-bold">{r.rating} / 5</div>
                    <div>{r.comment}</div>
                    <div className="text-xs text-muted-foreground">{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : ""}</div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mb-2 font-semibold">Sales Tips:</div>
            <ul className="list-disc pl-5 space-y-1">
              {tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
            {/* Modal for all reviews */}
            {showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
                  <button
                    className="absolute top-2 right-2 text-lg font-bold text-gray-600 hover:text-black"
                    onClick={() => setShowModal(false)}
                  >
                    ×
                  </button>
                  <h2 className="text-xl font-bold mb-4">All Reviews</h2>
                  {reviews.length === 0 ? (
                    <div className="text-muted-foreground">No reviews yet.</div>
                  ) : (
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                      {reviews.map(r => (
                        <li key={r.id} className="border rounded p-3 bg-background/80">
                          <div className="font-bold">{r.rating} / 5</div>
                          <div>{r.comment}</div>
                          <div className="text-xs text-muted-foreground">{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : ""}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
