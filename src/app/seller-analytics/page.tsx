
"use client";
// Update the import path to the correct location, for example:
import { useFirestore } from '../../firebase/provider';
import { query, collection, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';

// Update the import path to the correct location, for example:
import { useAuth } from "../../hooks/use-auth";
import { useCollection } from "@/firebase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/layout/AppLayout";
import { Separator } from "@/components/ui/separator";
import { BarChart2, TrendingUp, ShoppingBag } from "lucide-react";

export default function SellerAnalyticsPage() {
  const firestore = useFirestore();
  const { user, profile, loading: authLoading } = useAuth();
  const canReadFirestore =
    !authLoading &&
    !!user &&
    profile?.status === "ACTIVE";


  const q = useMemo(() => {
    if (canReadFirestore && firestore && user?.uid) {
      return query(
        collection(firestore, 'orders'),
        // where('sellerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }
    return null;
  }, [canReadFirestore, firestore, user?.uid]);
  const result = useCollection(q);
  const orders = result.data;
  const isLoading = result.isLoading;

  if (authLoading) return null;
  if (!user) return null;
  if (profile?.status !== "ACTIVE") return null;

  // Example stats (replace with real aggregation logic)
  const totalSales = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
  const avgOrder = totalSales ? totalRevenue / totalSales : 0;

  return (

      <div className="max-w-3xl mx-auto p-6 space-y-8">

        <h1 className="text-3xl font-bold flex items-center gap-2">
          Seller Analytics
        </h1>
            </div>
        );
      }
