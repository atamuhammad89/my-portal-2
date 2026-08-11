import { NextRequest, NextResponse } from 'next/server';
import { getComplianceRequirements, submitCompliance } from '@/lib/telnyx-api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const subOrderId = searchParams.get('id');

    if (!subOrderId) {
      return NextResponse.json({ message: 'Sub order id is required' }, { status: 400 });
    }

    const reqs = await getComplianceRequirements(subOrderId);
    return NextResponse.json(reqs);
  } catch (error: any) {
    console.error('[API /telnyx/compliance GET Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch compliance requirements' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { subOrderId, requirements } = body;

    if (!subOrderId || !requirements) {
      return NextResponse.json(
        { message: 'subOrderId and requirements are required' },
        { status: 400 }
      );
    }

    const result = await submitCompliance(subOrderId, requirements);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /telnyx/compliance PATCH Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to submit compliance' },
      { status: 500 }
    );
  }
}
