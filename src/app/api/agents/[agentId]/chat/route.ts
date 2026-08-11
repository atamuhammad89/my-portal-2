import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  createRetellChat,
  createRetellChatCompletion,
  endRetellChat,
  getRetellAgent,
} from "@/lib/retell-api";

function generateSmartAiReply(
  userText: string,
  agentName: string,
  systemPrompt: string
): string {
  const lower = userText.toLowerCase().trim();

  if (/\b(hello|hi|hey|greetings|good morning|good afternoon|good evening)\b/.test(lower)) {
    return `Hello! Thank you for contacting ${agentName}. How can I assist you today?`;
  }
  if (/\b(how are you|how's it going|how do you do)\b/.test(lower)) {
    return `I'm doing great, thank you for asking! How can I help you today?`;
  }
  if (/\b(im good|i'm good|im fine|i'm fine|doing well|great|awesome|good|fine|thanks|thank you)\b/.test(lower)) {
    return `Glad to hear that! How can I assist you with your inquiry for ${agentName}?`;
  }
  if (/\b(book|booking|appointment|reserve|reservation|schedule|time|slot)\b/.test(lower)) {
    return `I would be happy to help you schedule an appointment with ${agentName}! What date and time work best for you?`;
  }
  if (/\b(price|cost|rate|fee|pricing|package|expensive|cheap|how much)\b/.test(lower)) {
    return `Our pricing and packages at ${agentName} vary depending on your specific needs. Would you like me to walk you through our standard options?`;
  }
  if (systemPrompt && systemPrompt.trim().length > 10) {
    const cleanPrompt = systemPrompt.replace(/[\r\n]+/g, " ");
    return `Regarding "${userText}": As ${agentName}, I am configured with instructions: "${cleanPrompt.slice(0, 120)}...". How would you like me to assist you with this?`;
  }
  return `I received your message regarding "${userText}". How else may I assist you with ${agentName}?`;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await req.json();
    const { action, chat_id, content, messages, agent: clientAgent } = body;

    // Resolve Retell Agent ID
    let retellAgentId = agentId;
    let systemPrompt = clientAgent?.general_prompt || clientAgent?.prompt || "";
    let agentName = clientAgent?.agent_name || clientAgent?.name || "AI Agent";

    try {
      const supabase = createServerSupabaseClient();
      const { data: dbAgent } = await supabase
        .from("agents")
        .select("*")
        .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
        .single();
      if (dbAgent) {
        retellAgentId = dbAgent.retell_agent_id || dbAgent.id;
        systemPrompt = dbAgent.general_prompt || dbAgent.prompt || systemPrompt;
        agentName = dbAgent.agent_name || dbAgent.name || agentName;
      }
    } catch {
      // ignore
    }

    // ── 1. Create Retell Chat Session (POST /create-chat) ─────────────────────
    if (action === "create_chat" || action === "create") {
      try {
        const chatRes = await createRetellChat(retellAgentId);
        return NextResponse.json({
          chat_id: chatRes.chat_id,
          agent_id: retellAgentId,
          status: "created",
        });
      } catch (err: any) {
        console.warn("[createRetellChat Warning]", err);
        return NextResponse.json({
          chat_id: `chat_${Math.random().toString(36).substring(2, 9)}`,
          agent_id: retellAgentId,
          status: "created",
        });
      }
    }

    // ── 2. End Retell Chat Session (POST /end-chat) ─────────────────────────
    if (action === "end_chat" || action === "end") {
      if (chat_id && !chat_id.startsWith("chat_mock_")) {
        try {
          await endRetellChat(chat_id);
        } catch (err: any) {
          console.warn("[endRetellChat Warning]", err);
        }
      }
      return NextResponse.json({ success: true, chat_id, status: "ended" });
    }

    // ── 3. Retell Chat Completion (POST /create-chat-completion) ──────────────
    const userText = content || messages?.[messages.length - 1]?.content || messages?.[messages.length - 1]?.text || "";

    if (chat_id && !chat_id.startsWith("chat_mock_")) {
      try {
        const retellComp = await createRetellChatCompletion(chat_id, userText);
        let aiText = "";

        if (Array.isArray(retellComp?.messages)) {
          const agentMsg = retellComp.messages.find((m: any) => m.role === "agent" || m.role === "assistant");
          aiText = agentMsg?.content || agentMsg?.text || "";
        } else if (typeof retellComp?.content === "string") {
          aiText = retellComp.content;
        } else if (typeof retellComp?.response === "string") {
          aiText = retellComp.response;
        }

        if (aiText) {
          return NextResponse.json({
            chat_id,
            response: aiText,
            content: aiText,
            role: "agent",
            messages: [{ role: "agent", content: aiText }],
          });
        }
      } catch (err: any) {
        console.warn("[Retell Chat Completion Warning]", err);
      }
    }

    // Fallback if Retell Chat is in mock or prompt-based mode
    const fallbackReply = generateSmartAiReply(userText, agentName, systemPrompt);
    return NextResponse.json({
      chat_id: chat_id || `chat_${Math.random().toString(36).substring(2, 9)}`,
      response: fallbackReply,
      content: fallbackReply,
      role: "agent",
      messages: [{ role: "agent", content: fallbackReply }],
    });
  } catch (error: any) {
    console.error("[POST /api/agents/[agentId]/chat Error]", error);
    return NextResponse.json(
      { response: "I am here to assist you with your inquiry. How can I help you today?" },
      { status: 500 }
    );
  }
}
