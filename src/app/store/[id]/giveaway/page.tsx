"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getActiveGiveawayForSeller } from "@/lib/getActiveGiveawayForSeller";
import { enterStoreGiveaway } from "@/lib/storeGiveawayEntry";

export default function StoreGiveawayPage() {
  const params = useParams();
  const storeId = params?.id && (Array.isArray(params.id) ? params.id[0] : params.id);
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [giveaway, setGiveaway] = useState<any>(null);
  const [entered, setEntered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    getActiveGiveawayForSeller(storeId as string).then(setGiveaway);
  }, [storeId]);

  const handleEnter = async () => {
    if (!user || !giveaway) return;
    setSubmitting(true);
    setError(null);
    try {
      await enterStoreGiveaway({
        giveawayId: giveaway.id,
        storeId: giveaway.storeId,
        sellerUid: giveaway.ownerUid,
        userUid: user.uid,
      });
      setEntered(true);
      toast({ title: "Entry submitted!" });
    } catch (e: any) {
      setError(e.message || "Could not enter giveaway");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Giveaway</CardTitle>
          </CardHeader>
          <CardContent>
            {!giveaway && <div>No active giveaway for this store.</div>}
            {giveaway && (
              <div className="space-y-4">
                <div className="font-bold text-lg">{giveaway.title}</div>
                <div>{giveaway.description}</div>
                <div className="text-sm text-muted-foreground">Prize: {giveaway.prize}</div>
                {giveaway.imageUrl && (
                  <img src={giveaway.imageUrl} alt="Giveaway" className="w-full max-h-60 object-contain rounded" />
                )}
                <div className="text-xs text-muted-foreground">
                  Ends: {giveaway.endAt ? new Date(giveaway.endAt).toLocaleString() : "?"}
                </div>
                {entered ? (
                  <div className="text-green-600 font-semibold">You are entered!</div>
                ) : user ? (
                  <Button onClick={handleEnter} disabled={submitting}>
                    {submitting ? "Submitting..." : "Enter Giveaway"}
                  </Button>
                ) : (
                  <div className="text-sm text-muted-foreground">Sign in to enter.</div>
                )}
                {error && <div className="text-red-500 text-sm">{error}</div>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
