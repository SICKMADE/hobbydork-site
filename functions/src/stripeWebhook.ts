import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const db = admin.firestore();
const STRIPE_SECRET = defineSecret("STRIPE_SECRET");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
let stripe: Stripe | undefined;

export const stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const stripeSecret = process.env.STRIPE_SECRET;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecret) {
      console.error("Stripe secret not set in environment variables or Firebase config");
      res.status(500).send("Stripe secret not set in environment variables or Firebase config");
      return;
    }
    if (!webhookSecret) {
      console.error("Stripe webhook secret not set in environment variables or Firebase config");
      res.status(500).send("Stripe webhook secret not set in environment variables or Firebase config");
      return;
    }
    if (!stripe) {
      stripe = new Stripe(stripeSecret, {
        apiVersion: "2023-10-16",
      });
    }
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig as string, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed.", err);
      res.status(400).send(`Webhook Error: ${err}`);
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      // Spotlight purchase automation
      const spotlightStoreId = session.metadata?.spotlightStoreId;
      if (spotlightStoreId) {
        // Get the storefront doc
        const storeSnap = await db.collection("storefronts").where("id", "==", spotlightStoreId).limit(1).get();
        if (storeSnap.empty) {
          console.error("Storefront not found for spotlight", spotlightStoreId);
          res.status(404).send("Storefront not found");
          return;
        }
        const storeDoc = storeSnap.docs[0];
        const storeData = storeDoc.data();
        const ownerUid = storeData.ownerUid;
        // Calculate spotlight period (7 days from now)
        const now = admin.firestore.Timestamp.now();
        const endAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        // Create spotlight slot
        const slotRef = db.collection("spotlightSlots").doc();
        await slotRef.set({
          slotId: slotRef.id,
          storeId: spotlightStoreId,
          ownerUid,
          startAt: now,
          endAt,
          active: true,
          createdAt: now,
        });
        // Update storefront doc
        await storeDoc.ref.update({
          isSpotlighted: true,
          spotlightUntil: endAt,
          updatedAt: now,
        });
        // Notify store owner
        await db.collection("users").doc(ownerUid).collection("notifications").add({
          type: "SPOTLIGHT",
          title: "Your store is in the spotlight!",
          body: `Congratulations! Your store is now featured in the Store Spotlight for 7 days.`,
          relatedId: spotlightStoreId,
          read: false,
          createdAt: now,
        });
        res.status(200).send("Spotlight slot created");
        return;
      }
      // Auction fee payment
      const auctionId = session.metadata?.auctionId;
      const sellerUid = session.metadata?.sellerUid;
      if (auctionId && sellerUid) {
        await db.collection("users").doc(sellerUid).collection("notifications").add({
          type: "AUCTION",
          title: "Auction is now live!",
          body: `Your auction is now open to bidders.`,
          relatedId: auctionId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).send("Auction payment processed");
        return;
      }
      // Order payment (existing logic)
      const orderId = session.metadata?.orderId;
      const buyerUid = session.metadata?.buyerUid;
      if (orderId && buyerUid) {
        // Mark order as paid in Firestore
        await db.collection("orders").doc(orderId).update({
          status: "PAID",
          state: "PAID",
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentIntentId: session.payment_intent,
        });
        // Optionally notify buyer/seller here
        res.status(200).send("Order payment processed");
        return;
      }
    }
    res.status(200).send("Received");
  }
);
