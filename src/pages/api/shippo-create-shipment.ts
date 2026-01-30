import { NextApiRequest, NextApiResponse } from 'next';

const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY || 'shippo_test_1234567890abcdef1234567890abcdef'; // Replace with your real key or use env

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { toAddress, fromAddress, parcel } = req.body;
  if (!toAddress || !fromAddress || !parcel) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // 1. Create shipment
    const shipmentRes = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address_to: toAddress,
        address_from: fromAddress,
        parcels: [parcel],
        async: false,
      }),
    });
    const shipment = await shipmentRes.json();
    if (!shipment.rates || shipment.rates.length === 0) {
      return res.status(400).json({ error: 'No rates found', shipment });
    }
    // 2. Return rates to frontend
    return res.status(200).json({ shipmentId: shipment.object_id, rates: shipment.rates });
  } catch (err) {
    return res.status(500).json({ error: 'Shippo error', details: err });
  }
}
