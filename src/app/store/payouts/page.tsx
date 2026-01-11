"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { httpsCallable } from "firebase/functions";
import { getFirebase } from "@/firebase/client-init";

export default function PayoutsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [balance, setBalance] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const functions = getFirebase().functions;
        if (!functions) throw new Error("Cloud Functions are not available. Please try again in the browser.");
        const getPayouts = httpsCallable(functions, "getStripePayouts");
        const result = await getPayouts({});

        const data = result.data as { balance?: any; payouts?: any[] };
        setBalance(data.balance);
        setPayouts(data.payouts || []);
      } catch (err: any) {
        toast({ title: "Error", description: err.message });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  if (!user) return <div className="p-6">Sign in required.</div>;
  if (loading) return <div className="p-6">Loading payouts…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Payouts</h1>

      {/* BALANCE */}
      {balance && (
        <div className="border rounded p-4 bg-white shadow">
          <p className="font-semibold">Available Balance</p>
          <p className="text-xl">
            ${(balance.available[0]?.amount ?? 0) / 100}
          </p>

          <p className="font-semibold mt-4">Pending Balance</p>
          <p className="text-xl">
            ${(balance.pending[0]?.amount ?? 0) / 100}
          </p>
        </div>
      )}

      {/* RECENT PAYOUTS */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Recent Payouts</h2>

        {payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <div className="text-4xl mb-2">💸</div>
            <div className="font-semibold mb-1">No payouts yet</div>
            <div className="mb-2 text-sm">Once you receive payments, your payouts will show up here.</div>
            <a href="/store/dashboard" className="comic-button px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition">Go to Dashboard</a>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map((p) => (
              <div key={p.id} className="border rounded p-4 bg-white shadow">
                <p className="font-semibold">Amount: ${p.amount / 100}</p>
                <p>Status: {p.status}</p>
                <p>
                  Arrival: {p.arrival_date ? new Date(p.arrival_date * 1000).toLocaleDateString() : "—"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <a
        href="https://dashboard.stripe.com/"
        target="_blank"
        rel="noopener"
        className="text-blue-600 underline text-sm"
      >
        Open Stripe Dashboard
      </a>
    </div>
  );
}
