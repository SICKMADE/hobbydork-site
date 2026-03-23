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
// Firebase Cloud Function: Daily Seller Tier & Late Shipment Enforcement
const functionsV1 = __importStar(require("firebase-functions/v1"));
const firebaseAdmin_1 = require("./firebaseAdmin");
// Helper: Update seller stats and tier
const updateSellerTier_1 = require("./updateSellerTier");
// US Federal Holidays 2024-2027 (add more years as needed)
const federalHolidays = [
    '2024-01-01', '2024-01-15', '2024-02-19', '2024-05-27', '2024-06-19', '2024-07-04',
    '2024-09-02', '2024-10-14', '2024-11-11', '2024-11-28', '2024-12-25',
    '2025-01-01', '2025-01-20', '2025-02-17', '2025-05-26', '2025-06-19', '2025-07-04',
    '2025-09-01', '2025-10-13', '2025-11-11', '2025-11-27', '2025-12-25',
    '2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25', '2026-06-19', '2026-07-04',
    '2026-09-07', '2026-10-12', '2026-11-11', '2026-11-26', '2026-12-25',
    '2027-01-01', '2027-01-18', '2027-02-15', '2027-05-31', '2027-06-19', '2027-07-05',
    '2027-09-06', '2027-10-11', '2027-11-11', '2027-11-25', '2027-12-25'
].map(d => new Date(d).toDateString());
/**
 * Calculate business days between two dates, excluding weekends and federal holidays
 */
function getBusinessDaysBetween(startDate, endDate) {
    let businessDays = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
        const dayOfWeek = current.getDay();
        const dateString = current.toDateString();
        // Skip weekends (0 = Sunday, 6 = Saturday) and federal holidays
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !federalHolidays.includes(dateString)) {
            businessDays++;
        }
        current.setDate(current.getDate() + 1);
    }
    return businessDays;
}
exports.dailySellerEnforcement = functionsV1.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = new Date();
    const ordersRef = firebaseAdmin_1.db.collection('orders');
    const ordersSnap = await ordersRef.where('state', 'in', ['PAID', 'AWAITING_FULFILLMENT', 'SHIPPED']).get();
    const lateSellers = new Set();
    for (const doc of ordersSnap.docs) {
        const order = doc.data();
        const created = order.createdAt?.toDate ? order.createdAt.toDate() : null;
        if (!created)
            continue;
        const businessDaysSinceOrder = getBusinessDaysBetween(created, now);
        // 1. Mark as late if >2 business days and no tracking - buyer can cancel
        if (businessDaysSinceOrder > 2 && !order.trackingNumber) {
            await doc.ref.update({
                late: true,
                buyerCanCancel: true,
                lateShippingReason: 'No tracking number after 2 business days'
            });
            lateSellers.add(order.sellerUid);
        }
        // 2. Mark as late if >3 business days and tracking status is LABEL_CREATED
        if (businessDaysSinceOrder > 3 && order.trackingStatus === 'LABEL_CREATED') {
            await doc.ref.update({
                late: true,
                lateShippingReason: 'Label created but not shipped after 3 business days'
            });
            lateSellers.add(order.sellerUid);
        }
    }
    // Update seller stats and tier for affected sellers
    for (const sellerUid of lateSellers) {
        await (0, updateSellerTier_1.updateSellerTier)(sellerUid);
    }
    return null;
});
