"use client";

import { useAuth } from "@/hooks/use-auth";
import SellerOrders from "@/components/dashboard/SellerOrders";

export default function SellerOrdersPage() {
  const { user, loading } = useAuth();
  if (loading || !user) return null;
  return <SellerOrders sellerUid={user.uid} />;
}
