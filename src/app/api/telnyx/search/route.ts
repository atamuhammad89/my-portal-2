import { NextRequest, NextResponse } from 'next/server';
import { searchAvailableNumbers } from '@/lib/telnyx-api';
import { SearchFilters, PhoneNumberCapability, PhoneNumberType } from '@/types/telecom';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const country = searchParams.get('country') || 'US';
    const areaCode = searchParams.get('areaCode') || undefined;
    const type = (searchParams.get('type') || 'all') as PhoneNumberType | 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const featuresParam = searchParams.getAll('features');
    const features = featuresParam as PhoneNumberCapability[];

    const filters: SearchFilters = {
      country,
      areaCode,
      type,
      features,
      page,
      limit,
    };

    const numbers = await searchAvailableNumbers(filters);
    return NextResponse.json(numbers);
  } catch (error: any) {
    console.error('[API /telnyx/search Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to search phone numbers' },
      { status: 500 }
    );
  }
}
