import { NextApiRequest, NextApiResponse } from 'next';

const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY || 'shippo_test_1234567890abcdef1234567890abcdef';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { carrier, trackingNumber } = req.body;
  if (!carrier || !trackingNumber) {
    return res.status(400).json({ error: 'Missing carrier or tracking number' });
  }
  try {
    const response = await fetch('https://api.goshippo.com/tracks/', {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ carrier, tracking_number: trackingNumber }),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(400).json({ error: data.detail || 'Failed to fetch tracking info', data });
    }
    return res.status(200).json({
      status: data.tracking_status?.status,
      statusDetails: data.tracking_status?.status_details,
      eta: data.eta,
      history: data.tracking_history || [],
      raw: data
    });
  } catch (err) {
    return res.status(500).json({ error: 'Shippo error', details: err });
  }
}
