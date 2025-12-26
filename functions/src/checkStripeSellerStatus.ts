import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import Stripe from "stripe";
import cors from "cors";

const db = admin.firestore();
const corsHandler = cors({ origin: true });

let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const secret = process.env.STRIPE_SECRET;
  if (!secret) throw new Error("Missing Stripe secret");

  stripeInstance = new Stripe(secret, { apiVersion: "2023-10-16" });
  return stripeInstance;
}

export const checkStripeSellerStatus = functions
  .runWith({ secrets: ["STRIPE_SECRET"] })
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.json({ isSeller: false });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;

      const userRef = db.collection("users").doc(uid);
      const snap = await userRef.get();
      const data = snap.data();

      if (!data?.stripeAccountId) {
        return res.json({ isSeller: false });
      }

      const stripe = getStripe();
      const acct = await stripe.accounts.retrieve(data.stripeAccountId);

      if (acct.details_submitted && acct.charges_enabled) {
        await userRef.update({
          isSeller: true,
          sellerStatus: "APPROVED",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return res.json({ isSeller: true });
      }

      await userRef.update({
        isSeller: false,
        sellerStatus: "PENDING",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ isSeller: false });
    });
  });
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import Stripe from "stripe";
import cors from "cors";

const db = admin.firestore();
const corsHandler = cors({ origin: true });

let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const secret = process.env.STRIPE_SECRET;
  if (!secret) throw new Error("Missing Stripe secret");

  stripeInstance = new Stripe(secret, { apiVersion: "2023-10-16" });
  return stripeInstance;
}

export const checkStripeSellerStatus = functions
  .runWith({ secrets: ["STRIPE_SECRET"] })
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.json({ isSeller: false });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;

      const userRef = db.collection("users").doc(uid);
      const snap = await userRef.get();
      const data = snap.data();

      if (!data?.stripeAccountId) {
        return res.json({ isSeller: false });
      }

      const stripe = getStripe();
      const acct = await stripe.accounts.retrieve(data.stripeAccountId);

      if (acct.details_submitted && acct.charges_enabled) {
        await userRef.update({
          isSeller: true,
          sellerStatus: "APPROVED",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return res.json({ isSeller: true });
      }

      await userRef.update({
        isSeller: false,
        sellerStatus: "PENDING",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ isSeller: false });
    });
  });
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import Stripe from "stripe";
import cors from "cors";

const db = admin.firestore();
const corsHandler = cors({ origin: true });

let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const secret = process.env.STRIPE_SECRET;
  if (!secret) throw new Error("Missing Stripe secret");

  stripeInstance = new Stripe(secret, { apiVersion: "2023-10-16" });
  return stripeInstance;
}

export const checkStripeSellerStatus = functions
  .runWith({ secrets: ["STRIPE_SECRET"] })
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.json({ isSeller: false });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;

      const userRef = db.collection("users").doc(uid);
      const snap = await userRef.get();
      const data = snap.data();

      if (!data?.stripeAccountId) {
        return res.json({ isSeller: false });
      }

      const stripe = getStripe();
      const acct = await stripe.accounts.retrieve(data.stripeAccountId);

      if (acct.details_submitted && acct.charges_enabled) {
        await userRef.update({
          isSeller: true,
          sellerStatus: "APPROVED",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return res.json({ isSeller: true });
      }

      await userRef.update({
        isSeller: false,
        sellerStatus: "PENDING",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ isSeller: false });
    });
  });
