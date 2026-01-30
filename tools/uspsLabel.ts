// tools/uspsLabel.ts (DEPRECATED)
// This file used the old USPS Web Tools XML API and is now deprecated.
// Please use tools/uspsLabelOAuth.ts and /api/usps-label-oauth for all new USPS label creation.

// DEPRECATED: The code below is commented out to prevent accidental use.
/*
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const USPS_USER_ID = process.env.USPS_USER_ID || 'YOUR_USER_ID_HERE';
const USPS_API_URL = 'https://secure.shippingapis.com/ShippingAPI.dll';

export async function createUspsLabel({
  from,
  to,
  weightOz,
  serviceType = 'PRIORITY',
  labelType = 'PDF',
}: {
  from: { name: string; address1: string; address2?: string; city: string; state: string; zip: string; },
  to: { name: string; address1: string; address2?: string; city: string; state: string; zip: string; },
  weightOz: number;
  serviceType?: string;
  labelType?: string;
}) {
  const pounds = Math.floor(weightOz / 16);
  const ounces = weightOz % 16;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <eVSRequest USERID="${USPS_USER_ID}">
      <Option>1</Option>
      <Revision>2</Revision>
      <ImageParameters />
      <FromName>${from.name}</FromName>
      <FromFirm></FromFirm>
      <FromAddress1>${from.address2 || ''}</FromAddress1>
      <FromAddress2>${from.address1}</FromAddress2>
      <FromCity>${from.city}</FromCity>
      <FromState>${from.state}</FromState>
      <FromZip5>${from.zip}</FromZip5>
      <FromZip4></FromZip4>
      <ToName>${to.name}</ToName>
      <ToFirm></ToFirm>
      <ToAddress1>${to.address2 || ''}</ToAddress1>
      <ToAddress2>${to.address1}</ToAddress2>
      <ToCity>${to.city}</ToCity>
      <ToState>${to.state}</ToState>
      <ToZip5>${to.zip}</ToZip5>
      <ToZip4></ToZip4>
      <WeightInOunces>${weightOz}</WeightInOunces>
      <ServiceType>${serviceType}</ServiceType>
      <ImageType>${labelType}</ImageType>
      <LabelDate></LabelDate>
      <CustomerRefNo></CustomerRefNo>
      <AddressServiceRequested>False</AddressServiceRequested>
      <SenderName>${from.name}</SenderName>
      <SenderEMail></SenderEMail>
      <RecipientName>${to.name}</RecipientName>
      <RecipientEMail></RecipientEMail>
    </eVSRequest>`;

  const params = new URLSearchParams({
    API: 'eVS',
    XML: xml,
  });

  const { data } = await axios.get(USPS_API_URL + '?' + params.toString());
  const result = await parseStringPromise(data);
  return result;
}
*/
