"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/firebase/client-provider";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase/client-provider";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    activeListings: 0,
    soldListings: 0,
  });

  const [activeListings, setActiveListings] = useState([]);
  const [soldListings, setSoldListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [seller, setSeller] = useState(null);
  const [stripeStatus, setStripeStatus] = useState("NONE");

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        // Load seller account
        const sellerRef = doc(db, "users", user.uid);
        const sellerSnap = await getDoc(sellerRef);

        if (sellerSnap.exists()) {
          const sellerData = sellerSnap.data();
          setSeller(sellerData);

          if (!sellerData.stripeAccountId) {
            setStripeStatus("NONE");
          } else {
            setStripeStatus("CONNECTED");
          }
        }

        // Load listings
        const activeQ = query(
          collection(db, "listings"),
          where("userId", "==", user.uid),
          where("status", "==", "ACTIVE")
        );
        const soldQ = query(
          collection(db, "listings"),
          where("userId", "==", user.uid),
          where("status", "==", "SOLD")
        );

        const activeSnap = await getDocs(activeQ);
        const soldSnap = await getDocs(soldQ);

        const activeData = activeSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const soldData = soldSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setActiveListings(activeData);
        setSoldListings(soldData);

        // Load orders (GROSS revenue)
        const orderQ = query(
          collection(db, "orders"),
          where("sellerUid", "==", user.uid)
        );
        const orderSnap = await getDocs(orderQ);

        const orderData = orderSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setOrders(orderData);

        // Compute stats
        const revenue = orderData
          .filter((o) => o.status === "PAID")
          .reduce((sum, o) => sum + o.price, 0);

        const salesCount = orderData.filter((o) => o.status === "PAID").length;

        setStats({
          totalRevenue: revenue,
          totalSales: salesCount,
          activeListings: activeData.length,
          soldListings: soldData.length,
        });

      } catch (err) {
        toast({ title: "Error", description: err.message });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  async function startStripeOnboarding() {
    if (!user) return;

    try {
      const onboard = httpsCallable(functions, "onboardStripe");
      const result = await onboard({});
      if (result.data.url) {
        window.location.href = result.data.url;
      } else {
        toast({
          title: "Stripe Error",
          description: "Unable to start onboarding.",
        });
      }
    } catch (error) {
      toast({
        title: "Stripe Error",
        description: error.message || "Unable to start onboarding.",
      });
    }
  }

  if (!user) {
    return <div className="p-6">You must sign in to view the dashboard.</div>;
  }

  if (loading) {
    return <div className="p-6">Loading dashboard…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">

      {/* Dashboard Title */}
      <h1 className="text-3xl font-bold">Seller Dashboard</h1>

      {/* Stripe Status */}
      <div className="border rounded p-4 bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Stripe Account</h2>

        {stripeStatus === "NONE" && (
          <div className="space-y-2">
            <p className="text-red-600">You must connect Stripe to receive payments.</p>
            <Button onClick={startStripeOnboarding}>Connect Stripe</Button>
          </div>
        )}

        {stripeStatus === "CONNECTED" && (
          <p className="text-green-600 font-medium">
            Stripe account connected. You can receive payouts.
          </p>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded p-4 bg-white">
          <p className="text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold">${stats.totalRevenue}</p>
        </div>

        <div className="border rounded p-4 bg-white">
          <p className="text-gray-600">Total Sales</p>
          <p className="text-2xl font-bold">{stats.totalSales}</p>
        </div>

        <div className="border rounded p-4 bg-white">
          <p className="text-gray-600">Active Listings</p>
          <p className="text-2xl font-bold">{stats.activeListings}</p>
        </div>

        <div className="border rounded p-4 bg-white">
          <p className="text-gray-600">Sold Listings</p>
          <p className="text-2xl font-bold">{stats.soldListings}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Recent Orders</h2>

        {orders.length === 0 ? (
          <p className="text-gray-600">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="border rounded p-4 bg-white">
                <p className="font-semibold">{o.title}</p>
                <p>Price: ${o.price}</p>
                <p>Status: {o.status}</p>
                <p className="text-sm text-gray-600">
                  Buyer: {o.buyerUid}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Listings */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Active Listings</h2>

        {activeListings.length === 0 ? (
          <p className="text-gray-600">No active listings.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {activeListings.map((l) => (
              <Link key={l.id} href={`/listings/${l.id}`}>
                <div className="border rounded p-2 bg-white cursor-pointer">
                  <img
                    src={l.images[0]}
                    className="w-full h-40 object-cover rounded"
                  />
                  <p className="font-semibold mt-2">{l.title}</p>
                  <p>${l.price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Sold Listings */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Sold Listings</h2>

        {soldListings.length === 0 ? (
          <p className="text-gray-600">No sold listings.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {soldListings.map((l) => (
              <div key={l.id} className="border rounded p-2 bg-white">
                <img
                  src={l.images[0]}
                  className="w-full h-40 object-cover rounded"
                />
                <p className="font-semibold mt-2">{l.title}</p>
                <p>${l.price}</p>
                <p className="text-green-600 font-medium">SOLD</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
