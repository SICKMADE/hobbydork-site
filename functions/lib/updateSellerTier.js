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
exports.updateSellerTier = updateSellerTier;
const admin = __importStar(require("firebase-admin"));
function getTier(completedOrders, onTimeShippingRate, lateShipmentsLast30d) {
    if (completedOrders >= 100 && onTimeShippingRate >= 0.97 && lateShipmentsLast30d <= 1) {
        return 'GOLD';
    }
    if (completedOrders >= 20 && onTimeShippingRate >= 0.9 && lateShipmentsLast30d <= 5) {
        return 'SILVER';
    }
    return 'BRONZE';
}
async function updateSellerTier(sellerUid) {
    const db = admin.firestore();
    const now = Date.now();
    const ms30d = 30 * 24 * 60 * 60 * 1000;
    const ms60d = 60 * 24 * 60 * 60 * 1000;
    const ordersSnap = await db.collection('orders').where('sellerUid', '==', sellerUid).get();
    let completedOrders = 0;
    let lateShipmentsLast30d = 0;
    let lateShipmentsLast60d = 0;
    let fulfilledLast60d = 0;
    for (const orderDoc of ordersSnap.docs) {
        const order = orderDoc.data();
        const createdAtMs = order?.createdAt?.toDate ? order.createdAt.toDate().getTime() : null;
        if (order?.state === 'DELIVERED' || order?.state === 'COMPLETED') {
            completedOrders += 1;
        }
        if (!createdAtMs) {
            continue;
        }
        const age = now - createdAtMs;
        if (age <= ms60d) {
            fulfilledLast60d += 1;
            if (order?.late === true) {
                lateShipmentsLast60d += 1;
            }
        }
        if (age <= ms30d && order?.late === true) {
            lateShipmentsLast30d += 1;
        }
    }
    const onTimeShippingRate = fulfilledLast60d > 0
        ? Math.max(0, Math.min(1, (fulfilledLast60d - lateShipmentsLast60d) / fulfilledLast60d))
        : 1;
    const nextTier = getTier(completedOrders, onTimeShippingRate, lateShipmentsLast30d);
    const userRef = db.collection('users').doc(sellerUid);
    const userSnap = await userRef.get();
    const prevTier = userSnap.data()?.sellerTier ?? null;
    const updatePayload = {
        sellerTier: nextTier,
        completedOrders,
        onTimeShippingRate,
        lateShipmentsLast30d,
        lateShipmentsLast60d,
    };
    if (prevTier !== nextTier) {
        updatePayload.lastTierChange = admin.firestore.FieldValue.serverTimestamp();
    }
    await userRef.set(updatePayload, { merge: true });
}
