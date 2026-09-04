import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestJwt, requireRole } from '@/lib/jwt-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { listRetellAgents, listRetellPhoneNumbers, getRetellAgent } from '@/lib/retell-api';

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    if (payload && !requireRole(payload, ['super_admin', 'admin', 'operations', 'owner', 'support', 'finance', 'reseller'])) {
      return NextResponse.json({ message: 'Unauthorized. Access required.' }, { status: 403 });
    }

    const supabase = createServerSupabaseClient();

    const [phoneNumbersResult, retellApiAgentsResult, dbUsersResult, dbAgentsResult] = await Promise.all([
      listRetellPhoneNumbers().catch((e: any) => {
        console.warn('[Admin agents phone map warning]', e);
        return [];
      }),
      listRetellAgents().catch((e: any) => {
        console.warn('[Admin agents list error]', e);
        return [];
      }),
      (async () => {
        try {
          const { data } = await supabase.from('users').select('id, email, full_name');
          return data || [];
        } catch (e) {
          console.warn('[Admin Users DB Fetch Error]', e);
          return [];
        }
      })(),
      (async () => {
        try {
          const { data } = await supabase
            .from('agents')
            .select('id, retell_agent_id, name, voice_id, language, response_engine, llm_websocket_url, begin_message, general_prompt, created_by, created_at')
            .order('created_at', { ascending: false });
          return data || [];
        } catch (e) {
          console.warn('[Admin Agents DB Fetch Error]', e);
          return [];
        }
      })(),
    ]);

    const phoneNumbers = phoneNumbersResult || [];
    const retellApiAgents = retellApiAgentsResult || [];
    const dbUsers = dbUsersResult || [];
    const dbAgents = dbAgentsResult || [];

    const phoneMap = new Map<string, string>();
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

    const userMap = new Map<string, { email: string; full_name: string }>();
    (dbUsers || []).forEach((u: any) => {
      userMap.set(u.id, { email: u.email, full_name: u.full_name });
    });

    const dbAgentsMap = new Map<string, any>();
    (dbAgents || []).forEach((a: any) => {
      const u = a.created_by ? userMap.get(a.created_by) : null;
      const retellId = a.retell_agent_id || a.id;
      if (retellId) {
        dbAgentsMap.set(retellId, {
          ...a,
          users: u ? { id: a.created_by, email: u.email, full_name: u.full_name } : null,
        });
      }
    });

    const allAgentsMap = new Map<string, any>();

    // 1. Add all DB records
    dbAgentsMap.forEach((a, retellId) => {
      const realAgentId = a.retell_agent_id || a.id || retellId;
      allAgentsMap.set(realAgentId, {
        id: a.id,
        agent_id: realAgentId,
        agent_name: a.name || a.agent_name || 'Voice Agent',
        voice_id: a.voice_id || 'retell-Cimo',
        language: a.language || 'en-US',
        response_engine: { type: a.response_engine || 'retell-llm', llm_websocket_url: a.llm_websocket_url },
        begin_message: a.begin_message || '',
        general_prompt: a.general_prompt || '',
        phone_number: phoneMap.get(realAgentId) || null,
        created_at: a.created_at ? new Date(a.created_at).getTime() : Date.now(),
        last_modification_timestamp: a.created_at ? new Date(a.created_at).getTime() : Date.now(),
        userId: a.created_by,
        userEmail: a.users?.email || (a.created_by ? 'Registered User' : 'Unassigned / Free Agent'),
        userName: a.users?.full_name || (a.created_by ? 'User' : 'Unassigned'),
      });
    });

    // 2. Add all live Retell API agents (50+ agents)
    (Array.isArray(retellApiAgents) ? retellApiAgents : []).forEach((r: any) => {
      const agentId = r.agent_id || r.id;
      if (agentId) {
        const existing = allAgentsMap.get(agentId);
        allAgentsMap.set(agentId, {
          id: existing?.id || agentId,
          agent_id: agentId,
          agent_name: r.agent_name || existing?.agent_name || 'Voice Agent',
          voice_id: r.voice_id || existing?.voice_id || 'retell-Cimo',
          language: r.language || existing?.language || 'en-US',
          response_engine: r.response_engine || existing?.response_engine || { type: 'retell-llm' },
          begin_message: r.begin_message || existing?.begin_message || '',
          general_prompt: r.general_prompt || existing?.general_prompt || '',
          phone_number: phoneMap.get(agentId) || existing?.phone_number || null,
          created_at: r.created_at || existing?.created_at || Date.now(),
          last_modification_timestamp: r.last_modification_timestamp || existing?.last_modification_timestamp || Date.now(),
          userId: existing?.userId || null,
          userEmail: existing?.userEmail || 'Unassigned / Free Agent',
          userName: existing?.userName || 'Unassigned',
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