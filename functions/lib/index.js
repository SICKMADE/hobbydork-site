"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkStripeSellerStatus = exports.onboardStripe = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const cors_1 = __importDefault(require("cors"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const corsHandler = (0, cors_1.default)({ origin: true });
/* ---------------- HELPERS ---------------- */
function requireAuth(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Auth required");
    }
}
function requireVerified(context) {
    requireAuth(context);
    if (context.auth.token.email_verified !== true) {
        throw new functions.https.HttpsError("failed-precondition", "Email verification required");
    }
}
/* ---------------- STRIPE ---------------- */
let stripe = null;
function getStripe() {
    if (stripe)
        return stripe;
    const secret = process.env.STRIPE_SECRET;
    if (!secret)
        throw new Error("Missing STRIPE_SECRET");
    stripe = new stripe_1.default(secret, { apiVersion: "2023-10-16" });
    return stripe;
}
/* ---------------- ONBOARD STRIPE ---------------- */
exports.onboardStripe = functions
    .runWith({ secrets: ["STRIPE_SECRET"] })
    .https.onCall(async (_data, context) => {
    requireVerified(context);
    const uid = context.auth.uid;
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
    const baseUrl = process.env.APP_BASE_URL || "https://www.hobbydork.com";
    const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/onboarding/failed`,
        return_url: `${baseUrl}/onboarding/success`,
        type: "account_onboarding",
    });
    return { url: link.url };
});
/* ---------------- CHECK SELLER STATUS ---------------- */
exports.checkStripeSellerStatus = functions
    .runWith({ secrets: ["STRIPE_SECRET"] })
    .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith("Bearer ")) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const idToken = authHeader.split("Bearer ")[1];
            const decoded = await admin.auth().verifyIdToken(idToken);
            const uid = decoded.uid;
            const userRef = db.collection("users").doc(uid);
            const snap = await userRef.get();
            const user = snap.data();
            if (!user?.stripeAccountId) {
                return res.json({ isSeller: false });
            }
            const stripe = getStripe();
            const account = await stripe.accounts.retrieve(user.stripeAccountId);
            if (account.details_submitted && account.charges_enabled) {
                await userRef.update({
                    isSeller: true,
                    sellerStatus: "APPROVED",
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                return res.json({ isSeller: true });
            }
            return res.json({ isSeller: false });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "internal error" });
        }
    });
});
