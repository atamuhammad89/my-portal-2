import { NextRequest, NextResponse } from 'next/server';
import { createTelnyxAddress } from '@/lib/telnyx-api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      first_name,
      last_name,
      business_name,
      street_address,
      extended_address,
      locality,
      administrative_area,
      postal_code,
      country_code,
    } = body;

    if (!street_address || !locality || !postal_code || !country_code) {
      return NextResponse.json(
        { message: 'street_address, locality, postal_code, and country_code are required' },
        { status: 400 }
      );
    }

    const addressId = await createTelnyxAddress({
      first_name,
      last_name,
      business_name,
      street_address,
      extended_address,
      locality,
      administrative_area,
      postal_code,
      country_code,
    });

    return NextResponse.json({ success: true, id: addressId });
  } catch (error: any) {
    console.error('[API /telnyx/addresses POST Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create address' },
      { status: 500 }
    );
  }
}
