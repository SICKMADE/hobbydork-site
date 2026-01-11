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
exports.finalizeSeller = exports.createStripeOnboarding = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
admin.initializeApp();
const db = admin.firestore();
/* ================= HELPERS ================= */
/* ================= STRIPE ================= */
const stripe = new stripe_1.default(process.env.STRIPE_SECRET, {
    apiVersion: "2023-10-16",
});
/* ================= CREATE STRIPE ONBOARDING ================= */
exports.createStripeOnboarding = (0, https_1.onCall)({
    region: "us-central1",
    secrets: ["STRIPE_SECRET", "APP_BASE_URL"],
}, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Auth required");
    if (!request.auth || request.auth.token.email_verified !== true) {
        throw new https_1.HttpsError("failed-precondition", "Email verification required");
    }
    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    const user = snap.data();
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
        await userRef.set({
            stripeAccountId: accountId,
            sellerStatus: "PENDING",
            isSeller: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    const baseUrl = process.env.APP_BASE_URL || "http://localhost:9002";
    const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/onboarding/terms`,
        return_url: `${baseUrl}/onboarding/success`,
        type: "account_onboarding",
    });
    return { url: link.url };
});
/* ================= FINALIZE SELLER ================= */
exports.finalizeSeller = (0, https_1.onCall)({
    region: "us-central1",
    secrets: ["STRIPE_SECRET"],
}, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Auth required");
    if (!request.auth || request.auth.token.email_verified !== true) {
        throw new https_1.HttpsError("failed-precondition", "Email verification required");
    }
    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    const user = snap.data();
    if (!user?.stripeAccountId) {
        throw new https_1.HttpsError("failed-precondition", "Stripe not connected");
    }
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    if (!account.details_submitted || !account.charges_enabled) {
        throw new https_1.HttpsError("failed-precondition", "Stripe onboarding incomplete");
    }
    // Generate storeId from displayName (slugify)
    const displayName = user.ownerDisplayName || user.displayName || "";
    const storeId = displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    // Create store document
    const storeRef = db.collection("stores").doc(storeId);
    const storeSnap = await storeRef.get();
    if (!storeSnap.exists) {
        await storeRef.set({
            id: storeId,
            ownerId: uid,
            displayName,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            avatar: user.photoURL || "/hobbydork-head.png",
            status: "ACTIVE",
        });
    }
    // Update user doc with storeId and seller flags
    await userRef.update({
        isSeller: true,
        sellerStatus: "APPROVED",
        stripeOnboarded: true,
        stripeTermsAgreed: true,
        storeId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // Log new seller approval for admin monitoring
    await db.collection("sellerApprovals").add({
        uid,
        email: user.email,
        displayName,
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        stripeAccountId: user.stripeAccountId,
    });
    return { ok: true, storeId };
});
