import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const n8nWebhookUrl =
      process.env.N8N_CHATBOT_URL ||
      process.env.NEXT_PUBLIC_CHATBOT_URL ||
      "https://n8n-dev.callautomate.ai/webhook/0fad2dd7-61ba-400a-ae5d-e1b97f8e1145/chat";

    const activeSessionId = sessionId || `session_${Math.random().toString(36).substring(2, 11)}`;

    console.log(`[/api/chatbot] Sending message to n8n (session: ${activeSessionId})`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const n8nRes = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
      },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId: activeSessionId,
        chatInput: message.trim(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!n8nRes.ok) {
      const errText = await n8nRes.text().catch(() => "Unknown n8n error");
      console.error(`[/api/chatbot] n8n returned error status ${n8nRes.status}:`, errText);
      return NextResponse.json(
        {
          error: "n8n chatbot workflow error",
          output: "I'm having trouble connecting right now. Please try again or book a live demo at https://yumnahhasan.youcanbook.me/",
        },
        { status: 500 }
      );
    }

    const resData = await n8nRes.json();
    console.log("[/api/chatbot] n8n response received:", resData);

    let outputText = "";
    if (typeof resData === "string") {
      outputText = resData;
    } else if (resData?.output) {
      if (typeof resData.output === "string") {
        outputText = resData.output;
      } else if (Array.isArray(resData.output)) {
        outputText = resData.output
          .map((item: any) => (typeof item === "string" ? item : item?.text || item?.message || JSON.stringify(item)))
          .join("\n");
      } else if (typeof resData.output === "object") {
        outputText = resData.output?.text || resData.output?.message || JSON.stringify(resData.output);
      }
    } else if (resData?.text) {
      outputText = resData.text;
    } else if (resData?.message) {
      outputText = resData.message;
    } else {
      outputText = JSON.stringify(resData);
    }

    return NextResponse.json({
      success: true,
      output: outputText || "Thank you for reaching out! How else can I assist you?",
      sessionId: activeSessionId,
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
