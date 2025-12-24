import { useFirestore } from '@/firebase/provider';
import { query, collection, orderBy } from 'firebase/firestore';
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useCollection } from "@/firebase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/layout/AppLayout";
import { Separator } from "@/components/ui/separator";
import { BarChart2, TrendingUp, ShoppingBag } from "lucide-react";

export default function SellerAnalyticsPage() {
    // Get Firestore instance
    const firestore = useFirestore();
  const { user, profile } = useAuth();
  const { data: orders, isLoading } = useCollection(
    user?.uid
      ? query(
          collection(firestore, 'orders'),
          // where('sellerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
      : null
  );

  // Example stats (replace with real aggregation logic)
  const totalSales = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
  const avgOrder = totalSales ? totalRevenue / totalSales : 0;

  return (
    <AppLayout>
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
        <Separator className="my-8" />
        {/* Add charts and more analytics here */}
        <div className="text-muted-foreground text-sm">
          More analytics coming soon!
        </div>
      </div>
    </AppLayout>
  );
}
