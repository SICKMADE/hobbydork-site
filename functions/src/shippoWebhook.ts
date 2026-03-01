import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const shippoWebhook = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      // Shippo sends POST requests with tracking event
      if (req.method !== "POST") {
        res.status(400).send("GET requests not supported");
        return;
      }

      const event = req.body;

      // Shippo webhook body structure:
      // {
      //   "event": "track_updated",
      //   "test": false,
      //   "data": {
      //     "tracking_number": "1234567890",
      //     "address_from": { ... },
      //     "address_to": { ... },
      //     "eta": "2023-10-15T00:00:00Z",
      //     "status": { "status": "DELIVERED", "status_date": "2023-10-13T00:00:00Z", ... },
      //     ...
      //   }
      // }

      if (event.event !== "track_updated") {
        res.status(200).send("Ignoring non-tracking event");
        return;
      }

      const trackingData = event.data;
      const trackingNumber = trackingData?.tracking_number;
      const status = trackingData?.status?.status;
      const statusDate = trackingData?.status?.status_date;

      if (!trackingNumber || !status) {
        res.status(400).send("Missing tracking number or status");
        return;
      }

      // Only process DELIVERED status
      if (status !== "DELIVERED") {
        res.status(200).send(`Tracking status: ${status}`);
        return;
      }

      // Find the order with this tracking number
      const ordersSnap = await db
        .collection("orders")
        .where("trackingNumber", "==", trackingNumber)
        .limit(1)
        .get();

      if (ordersSnap.empty) {
        res.status(200).send("No order found with this tracking number");
        return;
      }

      const orderDoc = ordersSnap.docs[0];
      const orderId = orderDoc.id;
      const orderData = orderDoc.data();

      // Update order status to DELIVERED automatically
      await db.collection("orders").doc(orderId).update({
        status: "Delivered",
        deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
        carrierDeliveryDate: new Date(statusDate),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Notify buyer that package was delivered
      await db
        .collection("users")
        .doc(orderData.buyerUid)
        .collection("notifications")
        .add({
          type: "ORDER_DELIVERED",
          title: "Package Delivered! 📦",
          body: `Your order has been delivered. Please verify receipt of the item.`,
          relatedId: orderId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Notify seller that delivery was confirmed by carrier
      await db
        .collection("users")
        .doc(orderData.sellerUid)
        .collection("notifications")
        .add({
          type: "ORDER_DELIVERED",
          title: "Delivery Confirmed",
          body: `Tracking confirms order #${orderId} was delivered.`,
          relatedId: orderId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log(`Order ${orderId} automatically marked as delivered via Shippo webhook`);
      res.status(200).send(`Order ${orderId} updated to DELIVERED`);
    } catch (error) {
      console.error("Shippo webhook error:", error);
      res.status(500).send("Internal error processing webhook");
    }
  }
);
