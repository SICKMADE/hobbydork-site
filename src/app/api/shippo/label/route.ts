import { NextResponse } from 'next/server';

type ShippoAddress = {
  name: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
};

type ShippoParcel = {
  length: string;
  width: string;
  height: string;
  distance_unit: 'in' | 'cm';
  weight: string;
  mass_unit: 'lb' | 'kg' | 'oz' | 'g';
};

const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY;

function getDefaultFromAddress(): ShippoAddress | null {
  const name = process.env.SHIPPO_FROM_NAME || '';
  const street1 = process.env.SHIPPO_FROM_STREET1 || '';
  const city = process.env.SHIPPO_FROM_CITY || '';
  const state = process.env.SHIPPO_FROM_STATE || '';
  const zip = process.env.SHIPPO_FROM_ZIP || '';
  const country = process.env.SHIPPO_FROM_COUNTRY || 'US';
  const phone = process.env.SHIPPO_FROM_PHONE || undefined;
  const email = process.env.SHIPPO_FROM_EMAIL || undefined;

  if (!name || !street1 || !city || !state || !zip || !country) {
    return null;
  }

  return { name, street1, city, state, zip, country, phone, email };
}

function getDefaultParcel(): ShippoParcel {
  return {
    length: process.env.SHIPPO_DEFAULT_LENGTH || '10',
    width: process.env.SHIPPO_DEFAULT_WIDTH || '8',
    height: process.env.SHIPPO_DEFAULT_HEIGHT || '4',
    distance_unit: (process.env.SHIPPO_DEFAULT_DISTANCE_UNIT as 'in' | 'cm') || 'in',
    weight: process.env.SHIPPO_DEFAULT_WEIGHT || '1',
    mass_unit: (process.env.SHIPPO_DEFAULT_MASS_UNIT as 'lb' | 'kg' | 'oz' | 'g') || 'lb',
  };
}

async function shippoRequest(path: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.goshippo.com/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `ShippoToken ${SHIPPO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.detail || json?.error || 'Shippo request failed');
  }

  return json;
}

export async function POST(request: Request) {
  if (!SHIPPO_API_KEY) {
    return NextResponse.json({ error: 'SHIPPO_API_KEY is not configured' }, { status: 500 });
  }

  try {
    const { rateObjectId, toAddress, fromAddress, parcel } = await request.json();

    let selectedRateObjectId: string | null =
      typeof rateObjectId === 'string' && rateObjectId.trim() ? rateObjectId.trim() : null;

    if (!selectedRateObjectId) {
      const addressTo = toAddress as ShippoAddress | undefined;
      const addressFrom = (fromAddress as ShippoAddress | undefined) || getDefaultFromAddress() || undefined;
      const parcelData = (parcel as ShippoParcel | undefined) || getDefaultParcel();

      if (!addressTo || !addressTo.street1 || !addressTo.city || !addressTo.state || !addressTo.zip || !addressTo.country) {
        return NextResponse.json({ error: 'Missing valid toAddress for label creation' }, { status: 400 });
      }

      if (!addressFrom || !addressFrom.street1 || !addressFrom.city || !addressFrom.state || !addressFrom.zip || !addressFrom.country) {
        return NextResponse.json(
          {
            error: 'Missing fromAddress. Provide fromAddress in request or set SHIPPO_FROM_* environment variables.',
          },
          { status: 400 }
        );
      }

      const shipment = await shippoRequest('shipments/', {
        address_to: addressTo,
        address_from: addressFrom,
        parcels: [parcelData],
        async: false,
      });

      const rates = Array.isArray(shipment?.rates) ? shipment.rates : [];
      if (rates.length === 0) {
        return NextResponse.json({ error: 'No shipping rates available', shipment }, { status: 400 });
      }

      rates.sort((a: any, b: any) => Number(a?.amount || 0) - Number(b?.amount || 0));
      selectedRateObjectId = String(rates[0]?.object_id || '');
      if (!selectedRateObjectId) {
        return NextResponse.json({ error: 'Could not determine purchasable rate', shipment }, { status: 400 });
      }
    }

    const label = await shippoRequest('transactions/', {
      rate: selectedRateObjectId,
      label_file_type: 'PDF',
      async: false,
    });

    if (!label?.label_url || !label?.tracking_number) {
      return NextResponse.json({ error: 'Label purchase failed', label }, { status: 400 });
    }

    return NextResponse.json({
      label_url: label.label_url,
      tracking_number: label.tracking_number,
      carrier: label.tracking_provider,
      labelUrl: label.label_url,
      trackingNumber: label.tracking_number,
      rateObjectId: selectedRateObjectId,
      raw: label,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Shippo error', details: err?.message || String(err) }, { status: 500 });
  }
}
