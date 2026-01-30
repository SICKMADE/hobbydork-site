import { NextApiRequest, NextApiResponse } from 'next';

const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY || 'shippo_test_1234567890abcdef1234567890abcdef'; // Replace with your real key or use env

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { rateObjectId } = req.body;
  if (!rateObjectId) {
    return res.status(400).json({ error: 'Missing rateObjectId' });
  }
  try {
    // 1. Purchase label
    const labelRes = await fetch('https://api.goshippo.com/transactions/', {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate: rateObjectId,
        label_file_type: 'PDF',
        async: false,
      }),
    });
    const label = await labelRes.json();
    if (!label.label_url) {
      return res.status(400).json({ error: 'Label purchase failed', label });
    }
    return res.status(200).json({ labelUrl: label.label_url, trackingNumber: label.tracking_number, carrier: label.tracking_provider });
  } catch (err) {
    return res.status(500).json({ error: 'Shippo error', details: err });
  }
}
