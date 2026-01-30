import { NextApiRequest, NextApiResponse } from 'next';
import { trackUspsPackage } from '../../../tools/uspsTrack';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { trackingNumber } = req.body;
  if (!trackingNumber) {
    return res.status(400).json({ error: 'Missing trackingNumber' });
  }
  try {
    const tracking = await trackUspsPackage(trackingNumber);
    return res.status(200).json(tracking);
  } catch (err) {
    return res.status(500).json({ error: 'USPS error', details: err });
  }
}
