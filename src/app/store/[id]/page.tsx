"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/firebase/client-provider";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import Link from "next/link";

export default function StorefrontPage() {
  // Route is /store/[id]
  const params = useParams();
  const storeId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const storeIdStr = typeof storeId === "string" ? storeId : undefined;

  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    const sid = storeIdStr;
    if (!sid) return;
    async function loadSeller(sellerId: string) {
      const snap = await getDoc(doc(db, "users", sellerId));
      if (snap.exists()) setUser(snap.data());
    }
    loadSeller(sid);
  }, [storeIdStr]);

  useEffect(() => {
    const sid = storeIdStr;
    if (!sid) return;
    const q = query(
      collection(db, "listings"),
      where("ownerUid", "==", sid),
      where("status", "==", "ACTIVE")
    );

    const unsub = onSnapshot(q, (snap) => {
      setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [storeIdStr]);

  if (!storeIdStr) return <div className="p-6">Not found.</div>;

  if (!user) return <div className="p-6">Loading store…</div>;

  const spotlightActive = user.hasActiveSpotlight;
  const trustedSeller = user.totalSales >= 10;
  const trophies = typeof user.trophies === "number" ? user.trophies : 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">

      {/* SAFETY BANNER */}
      <div className="bg-blue-100 border border-blue-300 p-3 rounded text-sm text-blue-900">
        HobbyDork is a safe community.  
        Adult content and foul language are prohibited.
      </div>

      {/* MOBILE LAYOUT */}
      <div className="md:hidden space-y-6">

        <div className="flex items-center gap-4">
          <img
            src={user.avatar || "/hobbydork-head.png"}
            className="w-20 h-20 rounded-full object-cover"
          />

          <div>
            <p className="text-2xl font-bold">{user.displayName}</p>
            <p className="text-gray-600 text-sm">Store ID: {user.storeId}</p>
            <p className="text-gray-600 text-sm">Trophies: {trophies}</p>

            <div className="flex gap-2 mt-1">
              {spotlightActive && (
                <span className="px-2 py-1 bg-yellow-300 rounded text-xs">
                  Spotlight
                </span>
              )}

              {trustedSeller && (
                <span className="px-2 py-1 bg-green-300 rounded text-xs">
                  Trusted Seller
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href={`/messages/${storeIdStr}`}>
            <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded">
              Message Seller
            </button>
          </Link>

          <Link href={`/report/seller/${storeIdStr}`}>
            <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded">
              Report
            </button>
          </Link>
        </div>

        {user.about && (
          <div className="p-4 border bg-white rounded shadow">
            <p className="font-semibold mb-1">About This Seller</p>
            <p className="text-sm">{user.about}</p>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-xl font-bold">Active Listings</p>

          {listings.map((l) => (
            <Link key={l.id} href={`/listings/${l.id}`}>
              <div className="flex gap-3 border p-3 rounded shadow bg-white">
                <img
                  src={l.images?.[0] || "/hobbydork-head.png"}
                  className="w-20 h-20 rounded object-cover"
                />
                <div>
                  <p className="font-semibold">{l.title}</p>
                  <p className="text-gray-700">${l.price}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:block">
        <div className="grid grid-cols-3 gap-8">

          <div className="col-span-1 space-y-4">
            <div className="p-6 bg-white border rounded shadow space-y-3 text-center">
              <img
                src={user.avatar || "/hobbydork-head.png"}
                className="w-32 h-32 mx-auto rounded-full object-cover"
              />

              <p className="text-3xl font-bold">{user.displayName}</p>
              <p className="text-gray-600 text-sm">Store ID: {user.storeId}</p>
              <p className="text-gray-600 text-sm">Trophies: {trophies}</p>

              <div className="flex justify-center gap-2">
                {spotlightActive && (
                  <span className="px-2 py-1 bg-yellow-300 rounded text-xs">
                    Spotlight Seller
                  </span>
                )}

                {trustedSeller && (
                  <span className="px-2 py-1 bg-green-300 rounded text-xs">
                    Trusted Seller
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Link href={`/messages/${storeIdStr}`}>
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded">
                  Message Seller
                </button>
              </Link>

              <Link href={`/report/seller/${storeIdStr}`}>
                <button className="w-full bg-red-600 text-white px-4 py-2 rounded">
                  Report Seller
                </button>
              </Link>
            </div>

            {user.about && (
              <div className="p-4 bg-white border rounded shadow">
                <p className="font-semibold mb-1">About</p>
                <p className="text-sm">{user.about}</p>
              </div>
            )}

            <div className="p-4 bg-white border rounded shadow text-sm">
              <p><strong>Total Sales:</strong> {user.totalSales || 0}</p>
              <p>
                <strong>Joined:</strong>{" "}
                {new Date(user.createdAt?.toDate()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="col-span-2">
            <p className="text-2xl font-bold mb-4">Active Listings</p>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => (
                <Link key={l.id} href={`/listings/${l.id}`}>
                  <div className="border p-3 bg-white rounded shadow hover:shadow-lg transition">
                    <img
                      src={l.images?.[0] || "/hobbydork-head.png"}
                      className="w-full h-40 object-cover rounded"
                    />
                    <p className="font-semibold mt-2">{l.title}</p>
                    <p className="text-gray-700">${l.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
