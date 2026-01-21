"use client";

import SellerSidebar from "@/components/dashboard/SellerSidebar";
import Header from "@/components/layout/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart2, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore } from '@/firebase/provider';
import { query, collection, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import { useCollection } from "@/firebase";
import SellerSalesCharts from "@/components/dashboard/SellerSalesCharts";

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
        orderBy('createdAt', 'desc')
      );
    }
    return null;
  }, [canReadFirestore, firestore, user?.uid]);
  const result = useCollection(q);
  const orders = result.data;
  const isLoading = result.isLoading;

  // Example stats (replace with real aggregation logic)
  const totalSales = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
  const avgOrder = totalSales ? totalRevenue / totalSales : 0;

  if (authLoading) return null;
  if (!user) return null;
  if (profile?.status !== "ACTIVE") return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <SellerSidebar />
        <main className="flex-1 p-6 max-w-5xl mx-auto">
          <Header />
          <div className="max-w-3xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart2 className="w-7 h-7 text-primary" /> Sales Analytics
            </h1>
            <p className="text-muted-foreground mb-6">
              Track your store's performance and sales trends. (Demo data shown)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Sales</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" /> {totalSales}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Revenue</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold flex items-center gap-2">
                  $ {totalRevenue.toFixed(2)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Avg. Order</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold flex items-center gap-2">
                  $ {avgOrder.toFixed(2)}
                </CardContent>
              </Card>
            </div>
            <div className="my-8 border-t border-gray-300" />
            {/* Sales Charts */}
            <SellerSalesCharts sellerUid={user.uid} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
