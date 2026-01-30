import type { NextApiRequest, NextApiResponse } from 'next';
import { createUspsLabelOAuth } from '../../../tools/uspsLabelOAuth';

// Helper to get a fresh USPS OAuth token (reuse your usps-token endpoint or logic)
async function getUspsAccessToken() {
  // You should call your /api/usps-token endpoint or reuse the logic here
  // For demo, fetch from local endpoint
  const res = await fetch('http://localhost:3000/api/usps-token', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to get USPS access token');
  const data = await res.json();
  return data.access_token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { from, to, weightOz, serviceType, labelType } = req.body;
  if (!from || !to || !weightOz) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const accessToken = await getUspsAccessToken();
    const label = await createUspsLabelOAuth({ from, to, weightOz, serviceType, labelType, accessToken });
    return res.status(200).json(label);
  } catch (err: any) {
    return res.status(500).json({ error: 'USPS error', details: err.message || err });
  }
}
