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
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailySellerEnforcement = void 0;
const functionsV1 = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
// Helper: Update seller stats and tier
const updateSellerTier_1 = require("./updateSellerTier");
// TODO: Ensure updateSellerTier exists at the correct path, e.g. './lib/updateSellerTier.ts'
exports.dailySellerEnforcement = functionsV1.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = Date.now();
    const ms48h = 48 * 60 * 60 * 1000;
    const ms72h = 72 * 60 * 60 * 1000;
    const ordersRef = db.collection('orders');
    const ordersSnap = await ordersRef.where('state', 'in', ['PAID', 'AWAITING_FULFILLMENT', 'SHIPPED']).get();
    const lateSellers = new Set();
    for (const doc of ordersSnap.docs) {
        const order = doc.data();
        const created = order.createdAt?.toDate ? order.createdAt.toDate().getTime() : null;
        if (!created)
            continue;
        const age = now - created;
        // 1. Mark as late if >48h and no tracking
        if (age > ms48h && !order.trackingNumber) {
            await doc.ref.update({ late: true });
            lateSellers.add(order.sellerUid);
        }
        // 2. Mark as late if >72h and tracking status is LABEL_CREATED
        if (age > ms72h && order.trackingStatus === 'LABEL_CREATED') {
            await doc.ref.update({ late: true });
            lateSellers.add(order.sellerUid);
        }
    }
    // Update seller stats and tier for affected sellers
    for (const sellerUid of lateSellers) {
        await (0, updateSellerTier_1.updateSellerTier)(sellerUid);
    }
    return null;
});
