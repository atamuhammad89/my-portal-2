import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";
import { createRetellLlm, createRetellAgent } from "@/lib/retell-api";
import { CreateRetellAgentPayload } from "@/types/retell";

export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "operations", "support"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("agents")
    .select(`
      id, retell_agent_id, name, voice_id, language, response_engine,
      llm_websocket_url, begin_message, general_prompt, config,
      created_by, tenant_id, is_active, created_at, updated_at
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/admin/agents]", error);
    return NextResponse.json({ error: "Failed to fetch agents." }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin"])) {
    return NextResponse.json({ error: "Only super_admin can create agents." }, { status: 403 });
  }

  let body: CreateRetellAgentPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    name, voice_id, language, response_engine, llm_websocket_url,
    begin_message, general_prompt, assign_user_ids = []
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Agent name is required." }, { status: 400 });
  }
  if (!voice_id?.trim()) {
    return NextResponse.json({ error: "Voice ID is required." }, { status: 400 });
  }

  try {
    let responseEngine: { type: string; llm_id?: string; llm_websocket_url?: string };

    if (response_engine === "custom-llm" && llm_websocket_url?.trim()) {
      // Custom LLM via WebSocket — no llm_id needed
      responseEngine = { type: "custom_llm", llm_websocket_url: llm_websocket_url.trim() };
    } else {
      // Retell LLM — must create LLM first to get llm_id
      console.log("[POST /api/admin/agents] Creating Retell LLM...");
      const llm = await createRetellLlm({
        general_prompt: general_prompt?.trim(),
        begin_message: begin_message?.trim(),
      });
      console.log("[POST /api/admin/agents] LLM created:", llm.llm_id);
      responseEngine = { type: "retell-llm", llm_id: llm.llm_id };
    }

    // Build agent payload — voice_id is required by Retell
    const agentPayload = {
      agent_name: name.trim(),
      voice_id: voice_id.trim(),
      language: language ?? "en-US",
      response_engine: responseEngine,
      ...(begin_message?.trim() ? { begin_message: begin_message.trim() } : {}),
      ...(general_prompt?.trim() ? { general_prompt: general_prompt.trim() } : {}),
    };

    console.log("[POST /api/admin/agents] Creating Retell agent:", JSON.stringify(agentPayload));
    const retellAgent = await createRetellAgent(agentPayload);
    console.log("[POST /api/admin/agents] Agent created:", retellAgent.agent_id);

    // Persist to Supabase
    const supabase = createServerSupabaseClient();
    const { data: agentRow, error: insertError } = await supabase
      .from("agents")
      .insert({
        retell_agent_id: retellAgent.agent_id,
        name: name.trim(),
        voice_id: retellAgent.voice_id ?? null,
        language: retellAgent.language ?? "en-US",
        response_engine: retellAgent.response_engine?.type ?? "retell-llm",
        llm_websocket_url: retellAgent.response_engine?.llm_websocket_url ?? null,
        begin_message: begin_message?.trim() || null,
        general_prompt: general_prompt?.trim() || null,
        config: retellAgent,
        created_by: jwt!.sub,
        tenant_id: jwt!.tenantId,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Grant access to specified users
    if (assign_user_ids.length > 0 && agentRow) {
      const accessRows = assign_user_ids.map((uid) => ({
        user_id: uid,
        agent_id: agentRow.id,
        granted_by: jwt!.sub,
      }));
      const { error: accessError } = await supabase
        .from("user_agent_access")
        .insert(accessRows);
      if (accessError) {
        console.warn("[POST /api/admin/agents] Access grant warn:", accessError);
      }
    }

    return NextResponse.json(agentRow, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/agents] Full error:", err);
    return NextResponse.json({ error: "Failed to create agent. Please try again." }, { status: 500 });
  }
}