import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Sync Firestore user fields → Auth custom claims
 * Triggers on ANY write to /users/{uid}
 */
export const syncUserClaims = onDocumentWritten(
  "users/{uid}",
  async (event) => {
    const uid = event.params.uid;

    const after = event.data?.after;
    if (!after) return;

    const data = after.data();
    if (!data) return;

    const role = data.role ?? "USER";
    const isSeller = data.isSeller === true;

    await admin.auth().setCustomUserClaims(uid, {
      role,
      isSeller,
    });
  }
);
