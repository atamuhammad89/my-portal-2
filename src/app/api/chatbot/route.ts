import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, chatId, sessionId } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.RETELL_API_KEY || "key_d51ed714f1a6bb8b97da838edcd2";
    const agentId =
      process.env.RETELL_CHAT_AGENT_ID || "agent_a8a99142d7f97a2ce123c0a0b4";
    const baseUrl =
      process.env.RETELL_BASE_URL || "https://api.retellai.com";

    let activeChatId = chatId;

    // Retell chat IDs typically start with "chat_". If missing or invalid session ID, create a new chat session.
    if (!activeChatId || !activeChatId.startsWith("chat_")) {
      console.log(`[/api/chatbot] Creating new Retell AI chat session with agent ${agentId}...`);

      const createChatRes = await fetch(`${baseUrl}/create-chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: agentId,
        }),
      });

      if (!createChatRes.ok) {
        const errText = await createChatRes.text().catch(() => "Unknown Retell create-chat error");
        console.error(`[/api/chatbot] Retell create-chat error ${createChatRes.status}:`, errText);
        return NextResponse.json(
          {
            error: "Failed to initialize Retell chat session",
            output: "I'm having trouble starting our chat session right now. Please try again or book a live demo at https://yumnahhasan.youcanbook.me/",
          },
          { status: 500 }
        );
      }

      const createChatData = await createChatRes.json();
      activeChatId = createChatData.chat_id || createChatData.id;

      if (!activeChatId) {
        console.error("[/api/chatbot] No chat_id returned from Retell create-chat API:", createChatData);
        return NextResponse.json(
          {
            error: "No chat ID returned",
            output: "Chat session creation failed. Please try again shortly.",
          },
          { status: 500 }
        );
      }

      console.log(`[/api/chatbot] Retell AI chat created successfully: ${activeChatId}`);
    }

    console.log(`[/api/chatbot] Generating completion for chat_id: ${activeChatId}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const completionRes = await fetch(`${baseUrl}/create-chat-completion`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: activeChatId,
        content: message.trim(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!completionRes.ok) {
      const errText = await completionRes.text().catch(() => "Unknown Retell completion error");
      console.error(`[/api/chatbot] Retell create-chat-completion error status ${completionRes.status}:`, errText);
      return NextResponse.json(
        {
          error: "Retell chat completion error",
          output: "I'm having trouble retrieving a response right now. Please try again or reach out to us at support@callautomate.ai",
          chatId: activeChatId,
        },
        { status: 500 }
      );
    }

    const completionData = await completionRes.json();
    console.log("[/api/chatbot] Retell completion response received:", JSON.stringify(completionData));

    let outputText = "";

    if (Array.isArray(completionData.messages) && completionData.messages.length > 0) {
      // Find the latest agent message
      const agentMsgs = completionData.messages.filter((m: any) => m.role === "agent");
      if (agentMsgs.length > 0) {
        outputText = agentMsgs[agentMsgs.length - 1].content || "";
      } else {
        outputText = completionData.messages[0].content || "";
      }
    } else if (typeof completionData === "string") {
      outputText = completionData;
    } else if (completionData?.output) {
      outputText = typeof completionData.output === "string" ? completionData.output : JSON.stringify(completionData.output);
    } else if (completionData?.content) {
      outputText = completionData.content;
    }

    if (!outputText) {
      outputText = "Thank you for reaching out! How else can I assist you with CallAutomate?";
    }

    return NextResponse.json({
      success: true,
      output: outputText,
      chatId: activeChatId,
      sessionId: activeChatId, // Maintain backwards compatibility if frontend expects sessionId
    });
  } catch (err: any) {
    console.error("[/api/chatbot] Unexpected error:", err);
    return NextResponse.json(
      {
        error: err?.message || "Internal server error.",
        output: "Sorry, I ran into a technical hiccup. Please try again or reach our team at support@callautomate.ai",
      },
      { status: 500 }
    );
  }
}
