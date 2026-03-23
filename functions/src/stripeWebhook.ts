import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const db = admin.firestore();
const STRIPE_SECRET = defineSecret("STRIPE_SECRET");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
let stripe: Stripe | undefined;

const THEME_PRODUCT_TO_NAME: Record<string, string> = {
  p2: "Neon Syndicate Theme",
  p3: "Urban Theme",
  p4: "Comic Book Theme",
  p5: "Hobby Shop Theme",
};

export const stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    // --- Stripe rawBody check for debugging ---
    if (!req.rawBody) {
      console.error("Stripe webhook: req.rawBody is missing!", { headers: req.headers });
      res.status(400).send("No webhook payload provided.");
      return;
    }
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

      const productId = session.metadata?.productId;
      const buyerId = session.metadata?.buyerId;

      // Premium product purchase automation (current flow)
      if (productId && buyerId) {
        if (!buyerId) {
          console.error("buyerId is missing for premium product purchase", { session });
          res.status(400).send("buyerId missing");
          return;
        }
        const userRef = db.collection("users").doc(buyerId);
        await userRef.set(
          {
            ownedPremiumProducts: admin.firestore.FieldValue.arrayUnion(productId),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        // Spotlight purchase: p1
        if (productId === "p1") {
          const storeSnap = await db.collection("storefronts").where("ownerUid", "==", buyerId).limit(1).get();
          if (!storeSnap.empty) {
            const storeDoc = storeSnap.docs[0];
            const storeData = storeDoc.data() as any;
            const spotlightStoreId = storeData?.id || storeDoc.id;
            if (!spotlightStoreId) {
              console.error("spotlightStoreId is missing for spotlight purchase", { storeData, storeDocId: storeDoc.id });
            }
            const now = admin.firestore.Timestamp.now();
            const endAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

            const slotRef = db.collection("spotlightSlots").doc();
            await slotRef.set({
              slotId: slotRef.id,
              storeId: spotlightStoreId,
              ownerUid: buyerId,
              startAt: now,
              endAt,
              active: true,
              createdAt: now,
            });

            await storeDoc.ref.set(
              {
                isSpotlighted: true,
                spotlightUntil: endAt,
                updatedAt: now,
              },
              { merge: true }
            );

            await userRef.collection("notifications").add({
              type: "SPOTLIGHT",
              title: "Your store is in the spotlight!",
              body: "Your store has been featured for 7 days.",
              relatedId: spotlightStoreId,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            await userRef.collection("notifications").add({
              type: "SPOTLIGHT",
              title: "Spotlight purchase received",
              body: "We received your spotlight purchase, but no storefront was found yet. Create your storefront and contact support to apply it.",
              relatedId: productId,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          res.status(200).send("Spotlight purchase processed");
          return;
        }

        // Theme purchase: p2-p5
        const selectedTheme = THEME_PRODUCT_TO_NAME[productId];
        if (selectedTheme) {
          const storeSnap = await db.collection("storefronts").where("ownerUid", "==", buyerId).limit(1).get();
          if (!storeSnap.empty) {
            const storeDoc = storeSnap.docs[0];
            await storeDoc.ref.set(
              {
                selectedTheme,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }

          await userRef.set(
            {
              ownedThemes: admin.firestore.FieldValue.arrayUnion(selectedTheme),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          await userRef.collection("notifications").add({
            type: "THEME_PURCHASE",
            title: "Theme Unlocked!",
            body: `Your ${selectedTheme} is now available.`,
            relatedId: selectedTheme,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          res.status(200).send("Theme purchase processed");
          return;
        }

        // Utility product: p6 (Verified Dealer Pro)
        if (productId === "p6") {
          await userRef.set(
            {
              verifiedDealerPro: true,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          await userRef.collection("notifications").add({
            type: "UTILITY_PURCHASE",
            title: "Upgrade Activated",
            body: "Verified Dealer Pro has been applied to your account.",
            relatedId: productId,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          res.status(200).send("Utility purchase processed");
          return;
        }
      }

      // Legacy theme metadata compatibility
      const themeId = session.metadata?.themeId;
      if (themeId && buyerId) {
        // Grant the purchased theme to the user (add to ownedThemes array)
        const userRef = db.collection("users").doc(buyerId);
        await userRef.set({
          ownedThemes: admin.firestore.FieldValue.arrayUnion(themeId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        // Optionally notify user
        await userRef.collection("notifications").add({
          type: "THEME_PURCHASE",
          title: "Theme Unlocked!",
          body: `You have unlocked a new store theme!` ,
          relatedId: themeId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).send("Theme purchase processed");
        return;
      }

      // Legacy spotlight metadata compatibility
      const spotlightStoreId = session.metadata?.spotlightStoreId;
      if (spotlightStoreId) {
        const now = admin.firestore.Timestamp.now();
        const endAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

        const storeSnap = await db
          .collection("storefronts")
          .where("id", "==", spotlightStoreId)
          .limit(1)
          .get();

        if (!storeSnap.empty) {
          const storeDoc = storeSnap.docs[0];
          const storeData = storeDoc.data() as any;
          const ownerUid = storeData?.ownerUid;

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

          await storeDoc.ref.set(
            {
              isSpotlighted: true,
              spotlightUntil: endAt,
              updatedAt: now,
            },
            { merge: true }
          );

          if (ownerUid) {
            await db.collection("users").doc(ownerUid).collection("notifications").add({
              type: "SPOTLIGHT",
              title: "Your store is in the spotlight!",
              body: "Your store has been featured for 7 days.",
              relatedId: spotlightStoreId,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }

        res.status(200).send("Spotlight purchase processed");
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
        // Get order data to find seller and listing info
        const orderSnap = await db.collection("orders").doc(orderId).get();
        const orderData = orderSnap.data();
        const listingId = orderData?.listingId;
        
        // Mark order as paid in Firestore
        await db.collection("orders").doc(orderId).update({
          status: "Confirmed",
          state: "Confirmed",
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentIntentId: session.payment_intent,
          buyerUid: buyerUid,
        });

        // If we have listing ID, get seller info and finalize listing state
        if (listingId) {
          const listingSnap = await db.collection("listings").doc(listingId).get();
          const listingData = listingSnap.data();
          const sellerUid = listingData?.sellerId;
          const listingTitle = listingData?.title;

          // Mark listing sold / decrement stock
          if (listingSnap.exists) {
            const listingRef = db.collection("listings").doc(listingId);
            await db.runTransaction(async (tx) => {
              const latestSnap = await tx.get(listingRef);
              const latest = latestSnap.data() as any;
              if (!latestSnap.exists || !latest) return;

              const listingUpdates: Record<string, any> = {
                sold: true,
                soldAt: admin.firestore.FieldValue.serverTimestamp(),
                soldTo: buyerUid,
                orderId: orderId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              };

              if (latest.type === "Buy It Now") {
                const quantity = Number(latest.quantity ?? 1);
                const nextQuantity = Math.max(0, quantity - 1);
                listingUpdates.quantity = nextQuantity;
                if (nextQuantity === 0) {
                  listingUpdates.status = "Sold";
                  listingUpdates.visibility = "Invisible";
                }
              }

              if (latest.type === "Auction") {
                listingUpdates.status = "Sold";
                listingUpdates.paymentStatus = "PAID";
                listingUpdates.winnerUid = buyerUid;
                listingUpdates.winningBid = Number(latest.winningBid ?? latest.currentBid ?? latest.price ?? 0);
              }

              tx.update(listingRef, listingUpdates);
            });
          }

          // Notify seller of new order
          if (sellerUid) {
            const buyerSnap = await db.collection("users").doc(buyerUid).get();
            const buyerData = buyerSnap.data();
            const buyerName = buyerData?.displayName || buyerData?.username || "A user";

            await db.collection("users").doc(sellerUid).collection("notifications").add({
              type: "ORDER",
              title: "New Order Received!",
              body: `${buyerName} purchased: ${listingTitle}`,
              relatedId: orderId,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }

        // Notify buyer of successful payment
        await db.collection("users").doc(buyerUid).collection("notifications").add({
          type: "PAYMENT_SUCCESS",
          title: "Payment Confirmed",
          body: "Your order has been confirmed. Track your shipment in Orders.",
          relatedId: orderId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).send("Order payment processed");
        return;
      }
    }
    res.status(200).send("Received");
  }
);
