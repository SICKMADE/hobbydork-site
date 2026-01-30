// tools/uspsRates.ts
// Get USPS shipping rates using the Web Tools API
// Usage: import and call getUspsRates with your shipment details

import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const USPS_USER_ID = process.env.USPS_USER_ID || 'YOUR_USER_ID_HERE'; // Replace with your User ID or use env var
const USPS_API_URL = 'https://secure.shippingapis.com/ShippingAPI.dll';

export async function getUspsRates({
  fromZip,
  toZip,
  pounds = 0,
  ounces = 1,
  service = 'PRIORITY',
  container = '',
  size = 'REGULAR',
  machinable = true,
}: {
  fromZip: string;
  toZip: string;
  pounds?: number;
  ounces?: number;
  service?: string;
  container?: string;
  size?: string;
  machinable?: boolean;
}) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <RateV4Request USERID="${USPS_USER_ID}">
      <Revision>2</Revision>
      <Package ID="1ST">
        <Service>${service}</Service>
        <ZipOrigination>${fromZip}</ZipOrigination>
        <ZipDestination>${toZip}</ZipDestination>
        <Pounds>${pounds}</Pounds>
        <Ounces>${ounces}</Ounces>
        <Container>${container}</Container>
        <Size>${size}</Size>
        <Machinable>${machinable ? 'true' : 'false'}</Machinable>
      </Package>
    </RateV4Request>`;

  const params = new URLSearchParams({
    API: 'RateV4',
    XML: xml,
  });

  const { data } = await axios.get(USPS_API_URL + '?' + params.toString());
  const result = await parseStringPromise(data);
  return result;
}

// Example usage (uncomment to test):
// (async () => {
//   const rates = await getUspsRates({ fromZip: '90210', toZip: '10001' });
//   console.dir(rates, { depth: 10 });
// })();
