"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStripePayouts = void 0;
const https_1 = require("firebase-functions/v2/https");
const stripe_1 = __importDefault(require("stripe"));
const params_1 = require("firebase-functions/params");
/**
 * Callable function to get Stripe payouts and balance for a connected account.
 * Expects: { accountId: string }
 * Returns: { balance, payouts }
 */
const stripeSecret = (0, params_1.defineSecret)("STRIPE_SECRET");
exports.getStripePayouts = (0, https_1.onCall)({ secrets: [stripeSecret] }, async (request) => {
    if (!stripeSecret.value()) {
        throw new https_1.HttpsError("internal", "Stripe secret not set in environment");
    }
    const stripe = new stripe_1.default(stripeSecret.value(), { apiVersion: "2023-10-16" });
    const { accountId } = request.data || {};
    if (!accountId) {
        throw new https_1.HttpsError("invalid-argument", "Missing accountId");
    }
    try {
        // Get balance
        const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
        // Get recent payouts (limit 10)
        const payouts = await stripe.payouts.list({ limit: 10 }, { stripeAccount: accountId });
        return {
            balance,
            payouts: payouts.data,
        };
    }
    catch (err) {
        throw new https_1.HttpsError("internal", err.message || "Failed to fetch Stripe payouts");
    }
});
