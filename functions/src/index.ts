// Sync emailVerified on Auth user creation
export const syncEmailVerified = functions.auth.user().onCreate(
  async (user) => {
    if (user.emailVerified) {
      await admin.firestore().collection("users").doc(user.uid).set({
        emailVerified: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }
);
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import cors from "cors";


if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const corsHandler = cors({ origin: true });

/* =====================
   HELPERS
===================== */
function requireVerified(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Auth required");
  }
  if (context.auth.token.email_verified !== true) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Email must be verified"
    );
  }
}

/* =====================
   STRIPE
===================== */
let stripe: Stripe | null = null;

function getStripe() {
  if (stripe) return stripe;
  const secret = process.env.STRIPE_SECRET;
  if (!secret) throw new Error("Missing STRIPE_SECRET");
  stripe = new Stripe(secret, { apiVersion: "2023-10-16" });
  return stripe;
}

/* =====================
   STRIPE ONBOARDING
===================== */
export const onboardStripe = functions
  .runWith({ secrets: ["STRIPE_SECRET"] })
  .https.onCall(async (_data, context) => {
    requireVerified(context);

    const uid = context.auth!.uid;
    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    const user = snap.data();

    const stripe = getStripe();
    let accountId = user?.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      await userRef.update({
        stripeAccountId: accountId,
        sellerStatus: "PENDING",
        isSeller: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const baseUrl =
      process.env.APP_BASE_URL || "http://localhost:9002";

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/onboarding/failed`,
      return_url: `${baseUrl}/onboarding/success`,
      type: "account_onboarding",
    });

    return { url: link.url };
  });

/* =====================
   CHECK SELLER STATUS
===================== */
export const checkStripeSellerStatus = functions
  .runWith({ secrets: ["STRIPE_SECRET"] })
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split("Bearer ")[1];
        const decoded = await admin.auth().verifyIdToken(token);
        const uid = decoded.uid;

        const userRef = db.collection("users").doc(uid);
        const snap = await userRef.get();
        const user = snap.data();

        if (!user?.stripeAccountId) {
          return res.json({ isSeller: false });
        }

        const stripe = getStripe();
        const account = await stripe.accounts.retrieve(
          user.stripeAccountId
        );

        if (account.details_submitted && account.charges_enabled) {
          await userRef.update({
            isSeller: true,
            sellerStatus: "APPROVED",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return res.json({ isSeller: true });
        }

        return res.json({ isSeller: false });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "internal error" });
      }
    });
  });
