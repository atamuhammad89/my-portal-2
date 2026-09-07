import { NextRequest, NextResponse } from 'next/server';
import { getCountryRegulatoryRequirements } from '@/lib/telnyx-api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const country = searchParams.get('country') || 'US';
    const type = searchParams.get('type') || 'local';

    const reqs = await getCountryRegulatoryRequirements(country, type);
    return NextResponse.json(reqs);
  } catch (error: any) {
    console.error('[API /telnyx/compliance/requirements GET Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch country compliance requirements' },
      { status: 500 }
    );
  }
}
