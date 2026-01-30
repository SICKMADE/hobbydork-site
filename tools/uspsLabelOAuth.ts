// tools/uspsLabelOAuth.ts
// Create a USPS shipping label using the new OAuth 2.0 API
// Usage: import and call createUspsLabelOAuth with shipment details

import fetch from 'node-fetch';

// Use the USPS test environment for development. Switch to production for live use.
const USPS_API_URL = 'https://apis-tem.usps.com/ship/v1/labels'; // Test endpoint

export async function createUspsLabelOAuth({
  from,
  to,
  weightOz,
  serviceType = 'PRIORITY',
  labelType = 'PDF',
  accessToken,
}: {
  from: { name: string; address1: string; city: string; state: string; zip: string; },
  to: { name: string; address1: string; city: string; state: string; zip: string; },
  weightOz: number;
  serviceType?: string;
  labelType?: string;
  accessToken: string;
}) {
  // Convert ounces to pounds and ounces if needed
  const pounds = Math.floor(weightOz / 16);
  const ounces = weightOz % 16;

  // Build the request body according to the new USPS API spec
  const body = {
    fromAddress: {
      name: from.name,
      addressLine1: from.address1,
      city: from.city,
      state: from.state,
      zip: from.zip,
    },
    toAddress: {
      name: to.name,
      addressLine1: to.address1,
      city: to.city,
      state: to.state,
      zip: to.zip,
    },
    weight: {
      pounds,
      ounces,
    },
    serviceType,
    labelType,
  };

  const response = await fetch(USPS_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });


  if (!response.ok) {
    let errorText = '';
    try {
      errorText = await response.text();
    } catch (e) {
      errorText = '[unable to read error body]';
    }
    console.error('USPS label creation failed:', {
      status: response.status,
      statusText: response.statusText,
      errorText,
    });
    throw new Error(`USPS label creation failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}
