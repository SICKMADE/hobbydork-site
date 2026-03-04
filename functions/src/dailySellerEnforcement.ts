// Firebase Cloud Function: Daily Seller Tier & Late Shipment Enforcement
import * as functionsV1 from 'firebase-functions/v1';
import { admin, db } from './firebaseAdmin';

// Helper: Update seller stats and tier
import { updateSellerTier } from './updateSellerTier';

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
function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
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

export const dailySellerEnforcement = functionsV1.pubsub.schedule('every 24 hours').onRun(async (context: any) => {
  const now = new Date();
  const ordersRef = db.collection('orders');
  const ordersSnap = await ordersRef.where('state', 'in', ['PAID', 'AWAITING_FULFILLMENT', 'SHIPPED']).get();
  const lateSellers = new Set<string>();

  for (const doc of ordersSnap.docs) {
    const order = doc.data();
    const created = order.createdAt?.toDate ? order.createdAt.toDate() : null;
    if (!created) continue;
    
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
    await updateSellerTier(sellerUid);
  }

  return null;
});
