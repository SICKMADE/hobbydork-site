"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
// Removed unused import
import { endStoreGiveaway } from "@/lib/storeGiveawayEntry";
import { getStoreGiveawayEntries, pickStoreGiveawayWinner } from "@/lib/storeGiveawayEntry";
import { getActiveGiveawayForSeller } from "@/lib/getActiveGiveawayForSeller";

export default function StoreGiveawayManagePage() {
  const params = useParams();
  const storeId = params?.id && (Array.isArray(params.id) ? params.id[0] : params.id);
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [giveaway, setGiveaway] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only allow if seller owns this store
  const isOwner = profile?.isSeller && profile?.storeId === storeId;

  useEffect(() => {
    if (!storeId) return;
    getActiveGiveawayForSeller(storeId).then(setGiveaway);
  }, [storeId]);

  useEffect(() => {
    if (!giveaway) return;
    setLoadingEntries(true);
    getStoreGiveawayEntries(giveaway.id)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoadingEntries(false));
  }, [giveaway]);

  const handlePickWinner = async () => {
    if (!giveaway) return;
    setError(null);
    try {
      const winnerEntry = await pickStoreGiveawayWinner(giveaway.id);
      setWinner(winnerEntry);
      toast({ title: "Winner picked!" });
    } catch (e: any) {
      setError(e.message || "Could not pick winner");
    }
  };

  const handleEndGiveaway = async () => {
    if (!giveaway) return;
    setEnding(true);
    setError(null);
    try {
      await endStoreGiveaway(giveaway.id);
      setGiveaway(null);
      toast({ title: "Giveaway ended." });
    } catch (e: any) {
      setError(e.message || "Could not end giveaway");
    } finally {
      setEnding(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Store Giveaway</CardTitle>
          </CardHeader>
          <CardContent>
            {!isOwner && <div className="text-red-500">You do not have permission to manage this giveaway.</div>}
            {isOwner && !giveaway && (
              <div>No active giveaway. <a href="./giveaway-create" className="text-blue-600 underline">Create one</a>.</div>
            )}
            {isOwner && giveaway && (
              <div className="space-y-4">
                <div className="font-bold text-lg">{giveaway.title}</div>
                <div>{giveaway.description}</div>
                <div className="text-sm text-muted-foreground">Prize: {giveaway.prize}</div>
                <div className="text-xs text-muted-foreground">Ends: {giveaway.endAt ? new Date(giveaway.endAt).toLocaleString() : "?"}</div>
                <div className="font-semibold mt-4">Entries ({entries.length}):</div>
                {loadingEntries ? (
                  <div>Loading entries...</div>
                ) : entries.length === 0 ? (
                  <div>No entries yet.</div>
                ) : (
                  <ul className="list-disc pl-6">
                    {entries.map((entry) => (
                      <li key={entry.id}>{entry.displayName || entry.userUid}</li>
                    ))}
                  </ul>
                )}
                {winner && (
                  <div className="text-green-600 font-semibold">Winner: {winner.displayName || winner.userUid}</div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button onClick={handlePickWinner} disabled={!!winner || entries.length === 0}>Pick Winner</Button>
                  <Button onClick={handleEndGiveaway} disabled={ending}>End Giveaway</Button>
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
