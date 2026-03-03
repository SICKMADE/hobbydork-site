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
exports.onCreateGiveaway = exports.endExpiredGiveaways = exports.drawGiveawayWinner = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
// Callable function to manually draw a winner for a giveaway
exports.drawGiveawayWinner = (0, https_1.onCall)(async (request) => {
    const { giveawayId } = request.data || {};
    if (!giveawayId) {
        throw new https_1.HttpsError("invalid-argument", "Missing giveawayId");
    }
    // Verify user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be authenticated");
    }
    const db = admin.firestore();
    const giveawayRef = db.collection('giveaways').doc(giveawayId);
    const giveawayDoc = await giveawayRef.get();
    if (!giveawayDoc.exists) {
        throw new https_1.HttpsError("not-found", "Giveaway not found");
    }
    const giveaway = giveawayDoc.data();
    // Verify the user is the seller/owner of the giveaway
    if (giveaway.seller !== request.auth.uid && giveaway.sellerName !== request.auth.token.name) {
        throw new https_1.HttpsError("permission-denied", "Only the giveaway creator can draw a winner");
    }
    // Check if already ended
    if (giveaway.status === 'ended' || giveaway.status === 'Ended') {
        throw new https_1.HttpsError("failed-precondition", "This giveaway has already ended");
    }
    // Get all entries
    const entriesRef = giveawayRef.collection('giveawayEntries');
    const entriesSnap = await entriesRef.get();
    if (entriesSnap.empty) {
        // No entries, just end the giveaway
        await giveawayRef.update({
            status: 'ended',
            endedAt: admin.firestore.Timestamp.now()
        });
        return { success: true, message: "Giveaway ended with no entries", winner: null };
    }
    // Pick a random winner
    const entries = entriesSnap.docs;
    const winnerEntry = entries[Math.floor(Math.random() * entries.length)];
    const winnerData = winnerEntry.data();
    await giveawayRef.update({
        status: 'ended',
        endedAt: admin.firestore.Timestamp.now(),
        winnerUserId: winnerData.userId,
        winnerName: winnerData.userName || 'Anonymous'
    });
    return {
        success: true,
        message: "Winner drawn successfully!",
        winner: {
            userId: winnerData.userId,
            userName: winnerData.userName || 'Anonymous'
        }
    };
});
// Scheduled function to end giveaways and pick a winner
exports.endExpiredGiveaways = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const giveawaysRef = db.collection('giveaways');
    const snapshot = await giveawaysRef.where('status', '==', 'active').where('endTime', '<=', now).get();
    for (const doc of snapshot.docs) {
        const giveaway = doc.data();
        const entriesRef = giveawaysRef.doc(doc.id).collection('giveawayEntries');
        const entriesSnap = await entriesRef.get();
        if (entriesSnap.empty) {
            // No entries, just end the giveaway
            await doc.ref.update({ status: 'ended', endedAt: now });
            continue;
        }
        // Pick a random winner
        const entries = entriesSnap.docs;
        const winnerEntry = entries[Math.floor(Math.random() * entries.length)];
        await doc.ref.update({
            status: 'ended',
            endedAt: now,
            winnerUserId: winnerEntry.data().userId,
        });
        // Optionally: notify winner and seller here
    }
    return null;
});
// Helper: When creating a giveaway, ensure endTime is stored as Firestore Timestamp
exports.onCreateGiveaway = functions.firestore.document('giveaways/{giveawayId}').onCreate(async (snap, context) => {
    const data = snap.data();
    if (typeof data.endTime === 'string') {
        // Convert ISO string to Firestore Timestamp
        const ts = admin.firestore.Timestamp.fromDate(new Date(data.endTime));
        await snap.ref.update({ endTime: ts });
    }
});
