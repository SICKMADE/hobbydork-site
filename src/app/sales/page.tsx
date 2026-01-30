'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import AppLayout from '@/components/layout/AppLayout';
import PlaceholderContent from '@/components/PlaceholderContent';
import { useAuth } from '@/hooks/use-auth';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';

import {
  collection,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

import SellerSidebar from "@/components/dashboard/SellerSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

type OrderState =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

type OrderDoc = {
  id: string;
  buyerUid: string;
  sellerUid: string;
  state: OrderState;
  items: {
    title?: string;
    quantity?: number;
    price?: number;
  }[];
  subtotal: number;
  createdAt?: any;
};

function statusColor(state: OrderState) {
  switch (state) {
    case 'PENDING_PAYMENT':
      return 'bg-yellow-100 text-yellow-800';
    case 'PAID':
      return 'bg-green-100 text-green-800';
    case 'SHIPPED':
      return 'bg-blue-100 text-blue-800';
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return '';
  }
}


import { redirect } from 'next/navigation';

export default function SalesPage() {
  redirect('/seller/orders');
  return null;
}
