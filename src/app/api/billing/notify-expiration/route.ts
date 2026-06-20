// src/app/api/billing/notify-expiration/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    console.log("[notify-expiration] Webhook request received.");
    
    // 1. Verify Secret Authorization Token from Webhook
    const authHeader = req.headers.get("authorization");
    const webhookSecret = process.env.WEBHOOK_SECRET_KEY;

    if (!webhookSecret) {
      console.error("[notify-expiration] WEBHOOK_SECRET_KEY is not defined in environment variables.");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${webhookSecret}`) {
      console.warn("[notify-expiration] Unauthorized webhook call attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, name, planName, endedAt } = await req.json();
    console.log(`[notify-expiration] Authorized webhook call. Payload: email=${email}, name=${name}, planName=${planName}, endedAt=${endedAt}`);

    if (!email) {
      console.warn("[notify-expiration] Missing email address in webhook payload.");
      return NextResponse.json({ error: "Missing email address in payload" }, { status: 400 });
    }

    // 2. Resolve SMTP Settings
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER || "support@callautomate.ai";
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpPass) {
      console.error("[notify-expiration] Missing SMTP server settings (SMTP_HOST or SMTP_PASS) in environment variables.");
      return NextResponse.json({ error: "SMTP server misconfiguration" }, { status: 500 });
    }

    // 3. Create Nodemailer SMTP Transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports (like 587)
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // Require TLS if not using port 465
      tls: {
        rejectUnauthorized: true,
      },
    });

    // 4. Premium HTML Email Template Design
    const formattedDate = endedAt
      ? new Date(endedAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "recently";

    const mailOptions = {
      from: `"CallAutomate Support" <${smtpUser}>`,
      to: email,
      subject: "Action Required: Your CallAutomate Subscription Has Expired",
      text: `Hi ${name || "Customer"},\n\nYour subscription to the ${planName || "Active Plan"} expired on ${formattedDate}.\n\nTo restore full capabilities, please renew your plan at: https://callautomate.ai/billing\n\nBest regards,\nThe CallAutomate Support Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Subscription Expired</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #0f172a;
              color: #e2e8f0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .card {
              background-color: #1e293b;
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 24px;
              padding: 40px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
            }
            .logo {
              font-size: 24px;
              font-weight: 800;
              letter-spacing: -0.025em;
              background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-bottom: 8px;
            }
            .badge {
              display: inline-block;
              background-color: rgba(244, 63, 94, 0.1);
              border: 1px solid rgba(244, 63, 94, 0.2);
              color: #f43f5e;
              padding: 6px 16px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            h1 {
              font-size: 20px;
              font-weight: 700;
              margin-top: 0;
              margin-bottom: 16px;
              color: #f8fafc;
            }
            p {
              font-size: 15px;
              line-height: 1.625;
              color: #94a3b8;
              margin-top: 0;
              margin-bottom: 24px;
            }
            .plan-detail {
              background-color: #0f172a;
              border-radius: 16px;
              padding: 20px;
              margin-bottom: 32px;
              border: 1px solid rgba(255, 255, 255, 0.04);
            }
            .plan-row {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              padding: 6px 0;
            }
            .plan-label {
              color: #64748b;
            }
            .plan-value {
              font-weight: 600;
              color: #f1f5f9;
            }
            .cta-button {
              display: block;
              text-align: center;
              background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
              color: #0f172a !important;
              padding: 14px 24px;
              border-radius: 12px;
              font-size: 15px;
              font-weight: 700;
              text-decoration: none;
              transition: all 0.2s ease;
              box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
              margin-bottom: 32px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #475569;
              border-top: 1px solid rgba(255, 255, 255, 0.05);
              padding-top: 24px;
              margin-top: 32px;
            }
            .footer a {
              color: #64748b;
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">CallAutomate</div>
                <div class="badge">Subscription Expired</div>
              </div>
              
              <h1>Hello ${name || "Customer"},</h1>
              <p>Your subscription to the CallAutomate platform has ended. To prevent any service interruption or limitation on your agents, please review your billing details and renew your plan.</p>
              
              <div class="plan-detail">
                <div class="plan-row">
                  <span class="plan-label">Plan Name</span>
                  <span class="plan-value">${planName || "Active Plan"}</span>
                </div>
                <div class="plan-row">
                  <span class="plan-label">Expiration Date</span>
                  <span class="plan-value">${formattedDate}</span>
                </div>
              </div>
              
              <a href="https://callautomate.ai/billing" class="cta-button">Renew Subscription</a>
              
              <p style="margin-bottom: 0;">If you have any questions or require assistance, please reply directly to this email or reach out to us at <a href="mailto:${smtpUser}" style="color: #06b6d4; text-decoration: none;">${smtpUser}</a>.</p>
              
              <div class="footer">
                <p style="margin: 0; font-size: 12px; color: #475569;">
                  &copy; ${new Date().getFullYear()} CallAutomate. All rights reserved.<br>
                  Sent from support@callautomate.ai.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // 5. Send Email
    const info = await transporter.sendMail(mailOptions);
    console.log(`[notify-expiration] Expiration email successfully sent to ${email}. Message ID: ${info.messageId}`);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error("[notify-expiration] Internal server error handling webhook:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
