// Deprecated endpoint. Please use /api/usps-label-oauth instead.
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({ error: 'This endpoint is deprecated. Use /api/usps-label-oauth instead.' });
}
