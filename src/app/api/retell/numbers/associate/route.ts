import { NextRequest, NextResponse } from 'next/server';
import { associatePhoneNumberWithAgent } from '@/lib/retell-api';
import { updateMockNumberAgent } from '@/lib/telnyx-api';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, agentId } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { message: 'phoneNumber is required' },
        { status: 400 }
      );
    }

    let targetRetellAgentId: string | null = null;
    const rawAgentId = (agentId || '').trim();

    if (rawAgentId) {
      try {
        const supabase = createServerSupabaseClient();
        const { data: dbAgent } = await supabase
          .from('agents')
          .select('retell_agent_id')
          .or(`id.eq.${rawAgentId},retell_agent_id.eq.${rawAgentId}`)
          .maybeSingle();

        targetRetellAgentId = dbAgent?.retell_agent_id || rawAgentId;
      } catch (e) {
        targetRetellAgentId = rawAgentId;
      }
    }

    const result = await associatePhoneNumberWithAgent(phoneNumber, targetRetellAgentId);
    updateMockNumberAgent(phoneNumber, targetRetellAgentId || undefined);

    try {
      const supabase = createServerSupabaseClient();
      await supabase
        .from('phone_numbers')
        .update({ retell_agent_id: targetRetellAgentId || null, updated_at: new Date().toISOString() })
        .eq('phone_number', phoneNumber);
    } catch (e) {
      console.warn('[DB Agent Association Warning]', e);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /retell/numbers/associate Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to associate phone number with agent' },
      { status: error.status || 500 }
    );
  }
}
