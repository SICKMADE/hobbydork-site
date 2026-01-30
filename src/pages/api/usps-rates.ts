import { NextApiRequest, NextApiResponse } from 'next';
import { getUspsRates } from '../../../tools/uspsRates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { fromZip, toZip, pounds, ounces, service, container, size, machinable } = req.body;
  if (!fromZip || !toZip) {
    return res.status(400).json({ error: 'Missing fromZip or toZip' });
  }
  try {
    const rates = await getUspsRates({ fromZip, toZip, pounds, ounces, service, container, size, machinable });
    return res.status(200).json(rates);
  } catch (err) {
    return res.status(500).json({ error: 'USPS error', details: err });
  }
}
