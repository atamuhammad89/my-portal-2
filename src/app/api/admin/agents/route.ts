import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestJwt, requireRole } from '@/lib/jwt-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { listRetellAgents, listRetellPhoneNumbers, getRetellAgent } from '@/lib/retell-api';

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    if (!payload || !requireRole(payload, ['super_admin', 'admin', 'operations'])) {
      return NextResponse.json({ message: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Fetch phone numbers to build agent_id -> phone_number map
    const phoneMap = new Map<string, string>();
    try {
      const phoneNumbers = await listRetellPhoneNumbers({ skipCache: true });
      (phoneNumbers || []).forEach((p: any) => {
        const numStr = p.phone_number_pretty || p.phone_number;
        if (p.inbound_agents) {
          p.inbound_agents.forEach((a: any) => {
            if (a.agent_id) phoneMap.set(a.agent_id, numStr);
          });
        }
        if (p.outbound_agents) {
          p.outbound_agents.forEach((a: any) => {
            if (a.agent_id) phoneMap.set(a.agent_id, numStr);
          });
        }
        if (p.inbound_agent_id) phoneMap.set(p.inbound_agent_id, numStr);
        if (p.outbound_agent_id) phoneMap.set(p.outbound_agent_id, numStr);
      });
    } catch (e) {
      console.warn('[Admin agents phone map warning]', e);
    }

    const retellApiAgents = await listRetellAgents();
    let dbAgentsMap = new Map<string, any>();

    try {
      const supabase = createServerSupabaseClient();
      const { data: dbAgents, error } = await supabase
        .from('agents')
        .select(`
          id,
          retell_agent_id,
          name,
          voice_id,
          language,
          response_engine,
          llm_websocket_url,
          begin_message,
          general_prompt,
          created_at,
          created_by,
          users:created_by (id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (!error && dbAgents) {
        dbAgents.forEach((a: any) => {
          if (a.retell_agent_id) {
            dbAgentsMap.set(a.retell_agent_id, a);
          }
        });
      }
    } catch (e) {
      console.warn('[Admin Agents DB Fetch Error]', e);
    }

    const allAgentsMap = new Map<string, any>();

    // 1. Add all DB records
    dbAgentsMap.forEach((a, retellId) => {
      allAgentsMap.set(retellId, {
        id: a.id,
        agent_id: a.retell_agent_id,
        agent_name: a.name,
        voice_id: a.voice_id,
        language: a.language || 'en-US',
        response_engine: { type: a.response_engine || 'retell-llm', llm_websocket_url: a.llm_websocket_url },
        begin_message: a.begin_message,
        general_prompt: a.general_prompt,
        phone_number: phoneMap.get(retellId) || null,
        created_at: new Date(a.created_at).getTime(),
        last_modification_timestamp: new Date(a.created_at).getTime(),
        userId: a.created_by,
        userEmail: a.users?.email || (a.created_by ? 'Unknown User' : 'Unassigned / Free Agent'),
        userName: a.users?.full_name || (a.created_by ? 'System User' : 'Unassigned'),
      });
    });

    // 2. Add any live Retell API agents that might not be in DB yet
    (Array.isArray(retellApiAgents) ? retellApiAgents : []).forEach((r: any) => {
      const agentId = r.agent_id;
      if (agentId && !allAgentsMap.has(agentId)) {
        allAgentsMap.set(agentId, {
          id: agentId,
          agent_id: agentId,
          agent_name: r.agent_name || 'Voice Agent',
          voice_id: r.voice_id || 'retell-Cimo',
          language: r.language || 'en-US',
          response_engine: r.response_engine || { type: 'retell-llm' },
          begin_message: r.begin_message || '',
          general_prompt: r.general_prompt || '',
          phone_number: phoneMap.get(agentId) || null,
          created_at: r.created_at || Date.now(),
          last_modification_timestamp: r.last_modification_timestamp || r.created_at || Date.now(),
          userId: null,
          userEmail: 'Unassigned / Free Agent',
          userName: 'Unassigned',
        });
      }
    });

    return NextResponse.json(Array.from(allAgentsMap.values()));
  } catch (error: any) {
    console.error('[API /admin/agents GET Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch admin voice agents' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    if (!payload || !requireRole(payload, ['super_admin', 'admin', 'operations'])) {
      return NextResponse.json({ message: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { agentId, targetUserId, agentName } = body;

    if (!agentId) {
      return NextResponse.json(
        { message: 'agentId is required' },
        { status: 400 }
      );
    }

    const finalUserId = (!targetUserId || targetUserId === 'unassigned') ? null : targetUserId;

    // Fetch live details from Retell AI to preserve original agent_name and voice attributes
    let liveAgent: any = null;
    try {
      liveAgent = await getRetellAgent(agentId);
    } catch (e) {
      console.warn('[Fetch Live Agent for Reassign Warning]', e);
    }

    const realAgentName = liveAgent?.agent_name || agentName || body.name || 'Customer Support Assistant';
    const realVoiceId = liveAgent?.voice_id || 'retell-Cimo';
    const realLanguage = liveAgent?.language || 'en-US';

    const supabase = createServerSupabaseClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId);

    const updatePayload: Record<string, any> = {
      created_by: finalUserId,
      name: realAgentName,
      voice_id: realVoiceId,
      language: realLanguage,
      updated_at: new Date().toISOString(),
    };

    if (liveAgent?.begin_message) updatePayload.begin_message = liveAgent.begin_message;
    if (liveAgent?.general_prompt) updatePayload.general_prompt = liveAgent.general_prompt;

    let query = supabase.from('agents').update(updatePayload);

    if (isUuid) {
      query = query.eq('id', agentId);
    } else {
      query = query.eq('retell_agent_id', agentId);
    }

    const { data: updatedRows, error } = await query.select();

    if (error) {
      throw new Error(error.message);
    }

    // If agent wasn't in DB yet, insert the ownership row with real name & voice
    if (!updatedRows || updatedRows.length === 0) {
      const { error: insertErr } = await supabase.from('agents').insert({
        retell_agent_id: agentId,
        name: realAgentName,
        voice_id: realVoiceId,
        language: realLanguage,
        begin_message: liveAgent?.begin_message || null,
        general_prompt: liveAgent?.general_prompt || null,
        created_by: finalUserId,
      });
      if (insertErr) {
        console.warn('[Admin Reassign Insert Error]', insertErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: finalUserId ? 'Voice agent reassigned successfully.' : 'Voice agent freed / unassigned successfully.',
    });
  } catch (error: any) {
    console.error('[API /admin/agents PATCH Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to reassign voice agent' },
      { status: 500 }
    );
  }
}