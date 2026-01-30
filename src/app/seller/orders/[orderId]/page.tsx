  // (Moved inside SellerOrderDetail component)

"use client";
// Add type declaration for window.__orderData
declare global {
  interface Window {
    __orderData?: any;
  }
}

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { useAuth } from "@/hooks/use-auth";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { sendNotification } from "@/lib/notify";
import { getFriendlyErrorMessage } from '@/lib/friendlyError';

import { ToastAction } from "@/components/ui/toast";

export default function SellerOrderDetail({ params }: any) {
  const { user } = useAuth();
  const { id: orderId } = params;
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);

  // Remind seller to ship if not shipped within 2 business days
  useEffect(() => {
    if (order && order.state === "PAID" && user && user.uid === order.sellerUid && order.createdAt) {
      const created = order.createdAt.seconds ? order.createdAt.seconds * 1000 : new Date(order.createdAt).getTime();
      const now = Date.now();
      const twoBusinessDaysMs = 2 * 24 * 60 * 60 * 1000;
      if (now - created > twoBusinessDaysMs && !order._remindedSellerToShip) {
        sendNotification(order.sellerUid, {
          type: 'ORDER',
          title: 'Reminder: Ship Your Item',
          body: `Please ship your sold item (${order.items?.[0]?.title ?? 'an item'}) within 2 business days!`,
          relatedId: order.id,
        });
        // Optionally: set a flag in Firestore to avoid duplicate reminders
      }
    }
  }, [order, user]);

  useEffect(() => {
    if (!user || !db) return;
    // Only fetch needed fields for order
    const ref = doc(db!, "orders", orderId);
    const unsub = onSnapshot(ref, {
      includeMetadataChanges: true
    }, (snap) => {
      if (snap.exists()) {
        // Only select needed fields
        const data = snap.data();
        setOrder({
          id: snap.id,
          sellerUid: data.sellerUid,
          buyerUid: data.buyerUid,
          state: data.state,
          trackingNumber: data.trackingNumber,
          carrier: data.carrier,
          shippingAddress: data.shippingAddress,
          // Add other essential fields as needed
        });
      }
    });
    return () => unsub();
  }, [orderId, user]);

  if (!order || !user) {
    return <div className="p-6">Loading…</div>;
  }

  const isSeller = order.sellerUid === user.uid;

  // Notify seller on sale (order PAID)
  useEffect(() => {
    if (order && order.state === "PAID" && user && user.uid === order.sellerUid && !order._notifiedSellerOnSale) {
      sendNotification(order.sellerUid, {
        type: 'ORDER',
        title: 'New Sale!',
        body: `You sold: ${order.items?.[0]?.title ?? 'an item'}. Please ship it!`,
        relatedId: order.id,
      });
      // Optionally: set a flag in Firestore to avoid duplicate notifications
    }
  }, [order, user]);

  // Notify buyer on shipped
  async function markShipped(trackingNumber: string, carrier: string) {
    if (!db) return;
    try {
      await updateDoc(doc(db!, "orders", orderId), {
        state: "SHIPPED",
        trackingNumber,
        carrier,
        shippedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Notify buyer
      if (order && order.buyerUid) {
        await sendNotification(order.buyerUid, {
          type: 'ORDER',
          title: 'Your order has shipped!',
          body: `Order ${order.items?.[0]?.title ?? order.id} has shipped. Track your package!`,
          relatedId: order.id,
        });
      }
      toast({
        title: "Order marked as shipped",
        description: `Tracking number ${trackingNumber} (${carrier}) sent to buyer.`,
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error marking as shipped",
        description: getFriendlyErrorMessage(err) || "Could not update order. Please try again.",
        variant: "destructive",
        action: (
          <ToastAction altText="Contact Support" asChild>
            <a href="/help" target="_blank" rel="noopener">Contact Support</a>
          </ToastAction>
        ),
      });
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] p-4 bg-grid"
    >
      <div className="w-full max-w-xl md:max-w-2xl border-4 border-yellow-400 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col items-center gap-2 p-6 border-b-2 border-yellow-300">
          {/* Order Timeline/Status Tracker */}
          <div className="w-full flex justify-center mb-4">
            <ol className="flex items-center space-x-4 text-xs">
              <li className={`flex flex-col items-center ${order.state === 'PENDING_PAYMENT' ? 'text-yellow-600 font-bold' : 'text-muted-foreground'}`}>
                <span className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-yellow-400 bg-yellow-100">1</span>
                <span>Pending</span>
              </li>
              <li className={`flex flex-col items-center ${order.state === 'PAID' ? 'text-blue-600 font-bold' : order.state === 'SHIPPED' || order.state === 'DELIVERED' ? 'text-blue-600' : 'text-muted-foreground'}`}>
                <span className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-blue-400 bg-blue-100">2</span>
                <span>Paid</span>
              </li>
              <li className={`flex flex-col items-center ${order.state === 'SHIPPED' ? 'text-green-600 font-bold' : order.state === 'DELIVERED' ? 'text-green-600' : 'text-muted-foreground'}`}>
                <span className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-green-400 bg-green-100">3</span>
                <span>Shipped</span>
              </li>
              <li className={`flex flex-col items-center ${order.state === 'DELIVERED' ? 'text-emerald-600 font-bold' : 'text-muted-foreground'}`}>
                <span className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-100">4</span>
                <span>Delivered</span>
              </li>
            </ol>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Order Details</h1>
          <div className="flex flex-col items-center gap-1 mb-2">
            <span className="text-sm text-muted-foreground">Order Date: {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
            <span className="text-sm text-muted-foreground">Buyer: {order.buyerName || order.buyerUid}</span>
            <span className="text-sm text-muted-foreground">Seller: {order.sellerName || order.sellerUid}</span>
          </div>
          <div className="flex items-center gap-3 justify-center">
            {order.items?.[0]?.imageUrl && (
              <img
                src={order.items[0].imageUrl}
                alt={order.items[0].title ?? "Item"}
                className="w-12 h-12 min-w-[48px] min-h-[48px] rounded border object-cover"
              />
            )}
            <p className="font-semibold text-lg xs:text-xl text-center">
              {order.items?.[0]?.title ?? "Order"}
            </p>
          </div>
          <p className="text-base text-muted-foreground">${order.subtotal?.toFixed(2)}</p>
          <p className="text-base text-muted-foreground">Status: <span className="font-bold">{order.state}</span></p>
          {order.trackingNumber && (
            <div className="mt-2 flex flex-col items-center">
              <span className="font-semibold text-base text-blue-700">Tracking:</span>
              <span className="text-sm text-muted-foreground mb-1">{order.carrier}</span>
              <span className="inline-block px-4 py-2 rounded bg-gray-200 text-gray-700 font-bold text-lg border-2 border-gray-400 mt-1 tracking-wide">
                {order.trackingNumber}
              </span>
            </div>
          )}
          {/* Shipping Address (always show) */}
          <div className="mt-2 text-sm text-muted-foreground text-center">
            <span className="font-semibold">Shipping Address:</span><br />
            {order.shippingAddress ? (
              <>
                {order.shippingAddress.name && <span>{order.shippingAddress.name}<br /></span>}
                {order.shippingAddress.line1}<br />
                {order.shippingAddress.line2 && <span>{order.shippingAddress.line2}<br /></span>}
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                {order.shippingAddress.country}
              </>
            ) : (
              <span className="italic text-gray-400">Not provided</span>
            )}
          </div>
          {/* Payment Method (always show) */}
          <div className="mt-2 text-sm text-muted-foreground text-center">
            <span className="font-semibold">Payment Method:</span> {order.paymentMethod ? order.paymentMethod : <span className="italic text-gray-400">Not provided</span>}
          </div>
        </div>
        <div className="flex flex-col gap-4 items-center p-6">
          {/* Helpful Tips / Next Steps */}
          <div className="w-full mb-4">
            {isSeller && order.state === "PAID" && (
              <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2 text-center">
                <strong>Next Step:</strong> Fulfill the order and provide tracking info to the buyer.
              </div>
            )}
            {isSeller && order.state === "SHIPPED" && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2 text-center">
                <strong>Next Step:</strong> Wait for buyer to confirm delivery and leave feedback.
              </div>
            )}
            {isSeller && order.state === "DELIVERED" && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2 text-center">
                <strong>Order Complete:</strong> Thank you for fulfilling the order!
              </div>
            )}
          </div>
          {/* SELLER FULFILLMENT */}
          {isSeller && order.state === "PAID" && (
            <SellerFulfillForm onSubmit={markShipped} params={params} />
          )}
        </div>
      </div>
    </div>
  );
}



function SellerFulfillForm({ onSubmit, params }: any) {
  // Prefill from order data if available
  const order = typeof window !== "undefined" ? (window.__orderData || {}) : {};
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");
  const [length, setLength] = useState(order.items?.[0]?.packageLength || "");
  const [width, setWidth] = useState(order.items?.[0]?.packageWidth || "");
  const [height, setHeight] = useState(order.items?.[0]?.packageHeight || "");
  const [weight, setWeight] = useState(order.items?.[0]?.packageWeight || "");
  const [rates, setRates] = useState<any[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [labelUrl, setLabelUrl] = useState<string>("");
  const [labelPurchased, setLabelPurchased] = useState(false);
  const [error, setError] = useState<string>("");
  const [purchasing, setPurchasing] = useState(false);

  async function fetchRates() {
    setLoadingRates(true);
    setError("");
    setRates([]);
    setSelectedRate(null);
    setLabelUrl("");
    setLabelPurchased(false);
    try {
      // Build Shippo shipment request
      const toAddress = {
        name: order.shippingAddress?.name || "",
        street1: order.shippingAddress?.line1 || "",
        city: order.shippingAddress?.city || "",
        state: order.shippingAddress?.state || "",
        zip: order.shippingAddress?.postalCode || "",
        country: order.shippingAddress?.country || "US",
      };
      const fromAddress = {
        name: order.sellerName || "Seller",
        street1: order.sellerAddress?.line1 || "123 Main St",
        city: order.sellerAddress?.city || "",
        state: order.sellerAddress?.state || "",
        zip: order.sellerAddress?.postalCode || "",
        country: order.sellerAddress?.country || "US",
      };
      const parcel = {
        length: length,
        width: width,
        height: height,
        distance_unit: "in",
        weight: weight,
        mass_unit: "oz",
      };
      const res = await fetch("/api/shippo-create-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toAddress, fromAddress, parcel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch rates");
      setRates(data.rates || []);
    } catch (e: any) {
      setError(e.message || "Error fetching rates");
    } finally {
      setLoadingRates(false);
    }
  }

  async function purchaseLabel() {
    if (!selectedRate) return;
    setError("");
    setPurchasing(true);
    try {
      // Purchase label from Shippo
      const res = await fetch("/api/shippo-purchase-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rateObjectId: selectedRate.object_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to purchase label");
      setLabelUrl(data.labelUrl);
      setTracking(data.trackingNumber);
      setCarrier(data.carrier);
      setLabelPurchased(true);
      // Save label/tracking to Firestore order
      if (db && params?.orderId) {
        await updateDoc(doc(db, "orders", params.orderId), {
          labelUrl: data.labelUrl,
          trackingNumber: data.trackingNumber,
          carrier: data.carrier,
          shippedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (e: any) {
      setError(e.message || "Error purchasing label");
    } finally {
      setPurchasing(false);
    }
  }

  const canMarkShipped = labelPurchased && carrier.trim() && tracking.trim();

  return (
    <div className="p-3 xs:p-4 border rounded bg-white shadow space-y-2 xs:space-y-3">
      <p className="font-semibold text-base xs:text-lg">Fulfill Order</p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          className="border p-2 rounded w-full text-sm xs:text-base"
          placeholder="Length (in)"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          disabled={labelPurchased}
        />
        <input
          className="border p-2 rounded w-full text-sm xs:text-base"
          placeholder="Width (in)"
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          disabled={labelPurchased}
        />
        <input
          className="border p-2 rounded w-full text-sm xs:text-base"
          placeholder="Height (in)"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          disabled={labelPurchased}
          aria-label="Package Height (inches)"
          title="Package Height (inches)"
        />
        <label htmlFor="weight" className="block text-xs text-muted-foreground mb-1">Weight (oz):</label>
        <input
          id="weight"
          className="border p-2 rounded w-full text-sm xs:text-base"
          placeholder="Weight (oz)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          disabled={labelPurchased}
          aria-label="Package Weight (oz)"
          title="Package Weight (oz)"
        />
      </div>
      <div className="mb-2">
        <label className="block text-xs text-muted-foreground mb-1">Shipping Address (prefilled):</label>
        <textarea
          className="border p-2 rounded w-full text-xs"
          value={order.shippingAddress ? `${order.shippingAddress.name || ""}\n${order.shippingAddress.line1 || ""}\n${order.shippingAddress.line2 || ""}\n${order.shippingAddress.city || ""}, ${order.shippingAddress.state || ""} ${order.shippingAddress.postalCode || ""}\n${order.shippingAddress.country || ""}` : ""}
          readOnly
          rows={3}
          aria-label="Shipping Address"
          title="Shipping Address"
          placeholder="Shipping Address"
        />
      </div>
      {/* Shippo rates fetch */}
      {!labelPurchased && (
        <button
          className="w-full sm:w-auto px-4 py-2 rounded text-sm xs:text-base bg-indigo-600 text-white"
          onClick={fetchRates}
          disabled={loadingRates || !length || !width || !height || !weight}
          type="button"
        >
          {loadingRates ? 'Fetching Rates…' : 'Get Shipping Rates'}
        </button>
      )}
      {/* Show rates if available */}
      {!labelPurchased && rates.length > 0 && (
        <div className="mt-2">
          <label className="block text-xs text-muted-foreground mb-1">Select Shipping Rate:</label>
          <select
            id="shipping-rate-select"
            className="border p-2 rounded w-full text-sm xs:text-base mb-2"
            value={selectedRate?.object_id || ''}
            onChange={e => {
              const rate = rates.find(r => r.object_id === e.target.value);
              setSelectedRate(rate);
              setCarrier(rate?.provider || '');
            }}
            aria-label="Select Shipping Rate"
            title="Select Shipping Rate"
          >
            <option value="">Choose Rate</option>
            {rates.map(rate => (
              <option key={rate.object_id} value={rate.object_id}>
                {rate.provider} {rate.servicelevel?.name} - ${rate.amount} ({rate.estimated_days || '?'} days)
              </option>
            ))}
          </select>
          <button
            className="w-full sm:w-auto px-4 py-2 rounded text-sm xs:text-base bg-green-600 text-white"
            onClick={purchaseLabel}
            disabled={purchasing || !selectedRate}
            type="button"
          >
            {purchasing ? 'Purchasing Label…' : 'Purchase Label'}
          </button>
          {error && <div className="text-xs text-red-600 mt-2 font-semibold">{error}</div>}
          <p className="text-xs text-muted-foreground mt-1">Enter package details and get rates to purchase a shipping label before entering tracking info.</p>
        </div>
      )}
    </div>
  );
}
