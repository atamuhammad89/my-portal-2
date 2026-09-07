import { NextRequest, NextResponse } from 'next/server';
import { triggerExternalRequirementAction } from '@/lib/telnyx-api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requirementId, subOrderId } = body;

    if (!requirementId) {
      return NextResponse.json({ message: 'requirementId is required' }, { status: 400 });
    }

    const result = await triggerExternalRequirementAction(requirementId, subOrderId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /telnyx/compliance/external-action POST Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to trigger external requirement action' },
      { status: 500 }
    );
  }
}
