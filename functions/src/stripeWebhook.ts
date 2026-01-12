import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET!, {
  apiVersion: "2023-10-16",
});

// Stripe webhook handler for checkout.session.completed
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig as string, endpointSecret!);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    res.status(400).send(`Webhook Error: ${err}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    const buyerUid = session.metadata?.buyerUid;

    if (!orderId || !buyerUid) {
      console.error("Missing orderId or buyerUid in session metadata");
      res.status(400).send("Missing orderId or buyerUid");
      return;
    }

    // Fetch order from Firestore
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      console.error("Order not found", orderId);
      res.status(404).send("Order not found");
      return;
    }
    const order = orderSnap.data();
    const sellerUid = order?.sellerUid;

    // Update order status
    await orderRef.update({
      status: "PAID",
      paymentIntentId: session.payment_intent,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send notification to buyer
    await db.collection("users").doc(buyerUid).collection("notifications").add({
      type: "ORDER",
      title: "Thank you for your purchase!",
      body: order?.listingTitle
        ? `Your payment for "${order.listingTitle}" was successful. Your order #${orderId} is now being processed.`
        : `Your payment was successful. Your order #${orderId} is now being processed.`,
      relatedId: orderId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send notification to seller
    if (sellerUid) {
      await db.collection("users").doc(sellerUid).collection("notifications").add({
        type: "ORDER",
        title: "New sale!",
        body: order?.listingTitle
          ? `You sold "${order.listingTitle}" (Order #${orderId}). Please fulfill this order promptly.`
          : `You have received a new order (#${orderId}). Please fulfill this order promptly.`,
        relatedId: orderId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  res.status(200).send("Received");
});
