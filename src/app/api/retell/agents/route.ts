import { NextRequest, NextResponse } from 'next/server';
import { createRetellAgent, createRetellLlm, getRetellAgent, listRetellAgents, listRetellPhoneNumbers } from '@/lib/retell-api';
import { verifyRequestJwt } from '@/lib/jwt-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';

async function getFallbackUserId(): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: users } = await supabase.from('users').select('id').limit(1);
    if (users && users.length > 0) {
      return users[0].id;
    }
  } catch (e) {}
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    let userId = payload?.sub || null;
    const userRole = payload?.role || 'owner';

    if (!userId) {
      userId = await getFallbackUserId();
    }

    if (!userId) {
      return NextResponse.json([]);
    }

    const isSuperAdmin = ['super_admin', 'admin', 'operations', 'support'].includes(userRole);

    // Fetch live phone numbers from Retell API to build agent_id -> phone_number map
    const phoneMap = new Map<string, string>();
    try {
      const phoneNumbers = await listRetellPhoneNumbers();
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
      console.warn('[User agents phone map warning]', e);
    }

    const supabase = createServerSupabaseClient();

    // 1. If Super Admin: Fetch all agents in the platform
    if (isSuperAdmin) {
      try {
        const { data: dbAgents } = await supabase
          .from('agents')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbAgents && dbAgents.length > 0) {
          const allAgentsMap = new Map<string, any>();

          await Promise.all(
            dbAgents.map(async (dbRecord: any) => {
              const agentId = dbRecord.retell_agent_id || dbRecord.id;
              try {
                const live = await getRetellAgent(agentId);
                allAgentsMap.set(agentId, {
                  id: dbRecord.id,
                  agent_id: agentId,
                  agent_name: live.agent_name || dbRecord.name || 'Voice Agent',
                  voice_id: live.voice_id || dbRecord.voice_id || 'retell-Cimo',
                  language: live.language || dbRecord.language || 'en-US',
                  response_engine: live.response_engine || { type: dbRecord.response_engine || 'retell-llm' },
                  begin_message: live.begin_message || dbRecord.begin_message || '',
                  general_prompt: live.general_prompt || dbRecord.general_prompt || '',
                  phone_number: phoneMap.get(agentId) || dbRecord.phone_number || null,
                  created_at: live.created_at || (dbRecord.created_at ? new Date(dbRecord.created_at).getTime() : Date.now()),
                  last_modification_timestamp: live.last_modification_timestamp || live.created_at || Date.now(),
                });
              } catch (e) {
                allAgentsMap.set(agentId, {
                  id: dbRecord.id,
                  agent_id: agentId,
                  agent_name: dbRecord.name || 'Voice Agent',
                  voice_id: dbRecord.voice_id || 'retell-Cimo',
                  language: dbRecord.language || 'en-US',
                  response_engine: { type: dbRecord.response_engine || 'retell-llm' },
                  begin_message: dbRecord.begin_message || '',
                  general_prompt: dbRecord.general_prompt || '',
                  phone_number: phoneMap.get(agentId) || dbRecord.phone_number || null,
                  created_at: dbRecord.created_at ? new Date(dbRecord.created_at).getTime() : Date.now(),
                  last_modification_timestamp: dbRecord.created_at ? new Date(dbRecord.created_at).getTime() : Date.now(),
                });
              }
            })
          );

          return NextResponse.json(Array.from(allAgentsMap.values()));
        }
      } catch (adminErr) {
        console.warn('[Super Admin DB query warning]', adminErr);
      }

      // Fallback for Super Admin: Return live Retell API agents directly
      const liveList = await listRetellAgents();
      const formatted = (liveList || []).map((live: any) => ({
        id: live.agent_id,
        agent_id: live.agent_id,
        agent_name: live.agent_name || 'Voice Agent',
        voice_id: live.voice_id || 'retell-Cimo',
        language: live.language || 'en-US',
        response_engine: live.response_engine || { type: 'retell-llm' },
        begin_message: live.begin_message || '',
        general_prompt: live.general_prompt || '',
        phone_number: phoneMap.get(live.agent_id) || null,
        created_at: live.created_at || Date.now(),
        last_modification_timestamp: live.last_modification_timestamp || Date.now(),
      }));
      return NextResponse.json(formatted);
    }

    // 2. Regular User: Fetch assigned agents (user_agent_access + created_by)
    let assignedAgentIds: string[] = [];
    try {
      const { data: accessRows } = await supabase
        .from('user_agent_access')
        .select('agent_id')
        .eq('user_id', userId);
      if (accessRows) {
        assignedAgentIds = accessRows.map((r: any) => r.agent_id);
      }
    } catch (e) {
      console.warn('[User agent access query warn]', e);
    }

    let dbAgents: any[] = [];
    if (assignedAgentIds.length > 0) {
      const { data } = await supabase
        .from('agents')
        .select('*')
        .or(`created_by.eq.${userId},id.in.(${assignedAgentIds.join(',')}),retell_agent_id.in.(${assignedAgentIds.join(',')})`)
        .order('created_at', { ascending: false });
      dbAgents = data || [];
    } else {
      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });
      dbAgents = data || [];
    }

    if (dbAgents.length === 0) {
      return NextResponse.json([]);
    }

    const allAgentsMap = new Map<string, any>();

    await Promise.all(
      dbAgents.map(async (dbRecord: any) => {
        const agentId = dbRecord.retell_agent_id || dbRecord.id;
        try {
          const live = await getRetellAgent(agentId);
          allAgentsMap.set(agentId, {
            id: dbRecord.id,
            agent_id: agentId,
            agent_name: live.agent_name || dbRecord.name || 'Voice Agent',
            voice_id: live.voice_id || dbRecord.voice_id || 'retell-Cimo',
            language: live.language || dbRecord.language || 'en-US',
            response_engine: live.response_engine || { type: dbRecord.response_engine || 'retell-llm' },
            begin_message: live.begin_message || dbRecord.begin_message || '',
            general_prompt: live.general_prompt || dbRecord.general_prompt || '',
            phone_number: phoneMap.get(agentId) || dbRecord.phone_number || null,
            created_at: live.created_at || (dbRecord.created_at ? new Date(dbRecord.created_at).getTime() : Date.now()),
            last_modification_timestamp: live.last_modification_timestamp || live.created_at || Date.now(),
          });
        } catch (e) {
          allAgentsMap.set(agentId, {
            id: dbRecord.id,
            agent_id: agentId,
            agent_name: dbRecord.name || 'Voice Agent',
            voice_id: dbRecord.voice_id || 'retell-Cimo',
            language: dbRecord.language || 'en-US',
            response_engine: { type: dbRecord.response_engine || 'retell-llm' },
            begin_message: dbRecord.begin_message || '',
            general_prompt: dbRecord.general_prompt || '',
            phone_number: phoneMap.get(agentId) || dbRecord.phone_number || null,
            created_at: dbRecord.created_at ? new Date(dbRecord.created_at).getTime() : Date.now(),
            last_modification_timestamp: dbRecord.created_at ? new Date(dbRecord.created_at).getTime() : Date.now(),
          });
        }
      })
    );

    return NextResponse.json(Array.from(allAgentsMap.values()));
  } catch (error: any) {
    console.error('[API /retell/agents GET Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch user voice agents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    let userId = payload?.sub || null;

    if (!userId) {
      userId = await getFallbackUserId();
    }

    if (!userId) {
      return NextResponse.json({ message: 'User authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { agent_name, voice_id, response_engine, begin_message, general_prompt, language } = body;

    if (!voice_id) {
      return NextResponse.json(
        { message: 'voice_id is required' },
        { status: 400 }
      );
    }

    let finalResponseEngine = response_engine;

    // Retell AI API v2 requires an llm_id for retell-llm response engines. Create LLM first if missing.
    if (!finalResponseEngine || (finalResponseEngine.type === "retell-llm" && !finalResponseEngine.llm_id)) {
      const model = finalResponseEngine?.model || "gpt-4o";
      const createdLlm = await createRetellLlm({
        model,
        general_prompt: general_prompt || "You are a helpful AI voice assistant.",
        begin_message: begin_message || "Hello! How can I help you today?",
      });
      finalResponseEngine = {
        type: "retell-llm",
        llm_id: createdLlm.llm_id,
      };
    }

    // 1. Create agent on Retell AI REST API
    const createdAgent = await createRetellAgent({
      agent_name: agent_name || 'Unnamed Agent',
      voice_id,
      response_engine: finalResponseEngine,
      language: language || 'en-US',
    }, userId);

    // 2. Track in backend DB table (mapping retell_agent_id -> created_by = userId)
    const supabase = createServerSupabaseClient();
    const { data: dbRow, error: insertErr } = await supabase.from('agents').insert({
      retell_agent_id: createdAgent.agent_id,
      name: createdAgent.agent_name,
      voice_id: createdAgent.voice_id,
      language: createdAgent.language || 'en-US',
      response_engine: createdAgent.response_engine.type,
      llm_websocket_url: createdAgent.response_engine.llm_websocket_url || null,
      begin_message: createdAgent.begin_message || null,
      general_prompt: createdAgent.general_prompt || null,
      created_by: userId,
      tenant_id: payload?.tenantId || null,
    }).select().single();

    if (insertErr) {
      console.error('[Agent Backend DB Insert Error]', insertErr);
    }

    return NextResponse.json({
      ...createdAgent,
      id: dbRow?.id || createdAgent.agent_id,
      userId,
    });
  } catch (error: any) {
    console.error('[API /retell/agents POST Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create voice agent' },
      { status: 500 }
    );
  }
}
