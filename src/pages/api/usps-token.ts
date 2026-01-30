import type { NextApiRequest, NextApiResponse } from 'next';

// Store your USPS credentials securely, e.g. in environment variables
const USPS_CLIENT_ID = process.env.USPS_CLIENT_ID!;
const USPS_CLIENT_SECRET = process.env.USPS_CLIENT_SECRET!;
// Use the USPS test OAuth endpoint for development. Switch to production for live use.
const USPS_TOKEN_URL = 'https://apis-tem.usps.com/oauth2/v3/token';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', USPS_CLIENT_ID);
    params.append('client_secret', USPS_CLIENT_SECRET);
    // Optionally, add scope if required by your USPS app:
    // params.append('scope', 'labels tracking rates');

    const response = await fetch(USPS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
