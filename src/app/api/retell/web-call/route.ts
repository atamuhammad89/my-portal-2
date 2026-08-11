import { NextRequest, NextResponse } from 'next/server';
import { createRetellWebCall } from '@/lib/retell-api';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, retell_agent_id, agent_override } = body;

    let targetAgentId = retell_agent_id || agentId;

    if (!targetAgentId) {
      return NextResponse.json({ message: 'agentId is required' }, { status: 400 });
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data: dbAgent } = await supabase
        .from('agents')
        .select('retell_agent_id')
        .or(`id.eq.${targetAgentId},retell_agent_id.eq.${targetAgentId}`)
        .single();

      if (dbAgent?.retell_agent_id) {
        targetAgentId = dbAgent.retell_agent_id;
      }
    } catch {
      // Ignore DB lookup fallback and proceed with targetAgentId
    }

    const webCallData = await createRetellWebCall(targetAgentId, agent_override);
    return NextResponse.json(webCallData);
  } catch (error: any) {
    console.error('[API /retell/web-call Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to start web call test session on Retell AI' },
      { status: error.status || 500 }
    );
  }
}
