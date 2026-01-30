// tools/uspsTrack.ts
// Track a USPS package using the Web Tools API
// Usage: import and call trackUspsPackage with your tracking number

import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const USPS_USER_ID = process.env.USPS_USER_ID || 'YOUR_USER_ID_HERE'; // Replace with your User ID or use env var
const USPS_API_URL = 'https://secure.shippingapis.com/ShippingAPI.dll';

export async function trackUspsPackage(trackingNumber: string) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <TrackFieldRequest USERID="${USPS_USER_ID}">
      <Revision>1</Revision>
      <ClientIp>127.0.0.1</ClientIp>
      <SourceId>HobbyDork</SourceId>
      <TrackID ID="${trackingNumber}" />
    </TrackFieldRequest>`;

  const params = new URLSearchParams({
    API: 'TrackV2',
    XML: xml,
  });

  const { data } = await axios.get(USPS_API_URL + '?' + params.toString());
  const result = await parseStringPromise(data);
  return result;
}

// Example usage (uncomment to test):
// (async () => {
//   const tracking = await trackUspsPackage('9400111899223856928499');
//   console.dir(tracking, { depth: 10 });
// })();
