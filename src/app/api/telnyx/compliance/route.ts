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

    if (result && result.id) {
      try {
        const { createServerSupabaseClient } = await import('@/lib/supabase-server');
        const supabase = createServerSupabaseClient();
        await supabase
          .from('phone_orders')
          .update({
            status: result.status,
            requirements_met: result.requirementsMet,
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', result.id);
      } catch (e) {
        console.warn('[Compliance DB Sync Warning]', e);
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /telnyx/compliance PATCH Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to submit compliance' },
      { status: 500 }
    );
  }
}
