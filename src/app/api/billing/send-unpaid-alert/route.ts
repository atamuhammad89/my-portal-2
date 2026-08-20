import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { verifyRequestJwt } from "@/lib/jwt-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getAppBaseUrl } from "@/utils/url-helper";

export async function POST(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const targetUserId = body.userId || payload.sub;
    const supabase = createServerSupabaseClient();
    
    // Fetch user email & details
    const { data: user } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", targetUserId)
      .single();

    // Fetch unpaid invoices
    const { data: unpaidInvoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", targetUserId)
      .neq("status", "paid");

    if (!unpaidInvoices || unpaidInvoices.length === 0) {
      return NextResponse.json({ message: "No unpaid invoices found for this user." });
    }

    const totalAmount = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    const recipientEmail = user?.email || payload.email;

    if (!recipientEmail) {
      return NextResponse.json({ error: "Recipient email not found." }, { status: 400 });
    }

    // SMTP Configuration
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER || "support@callautomate.ai";
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpPass) {
      console.warn("[send-unpaid-alert] Missing SMTP settings in .env (SMTP_HOST/SMTP_PASS). Alert logged to console.");
      return NextResponse.json({
        success: true,
        message: `Alert generated for ${recipientEmail}. (Note: Configure SMTP_HOST & SMTP_PASS in .env to dispatch live emails)`,
        recipientEmail,
        totalAmount,
        unpaidCount: unpaidInvoices.length,
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const appUrl = getAppBaseUrl(req);
    const billingUrl = `${appUrl}/billing`;

    const invoiceRowsHtml = unpaidInvoices.map((inv) => `
      <tr style="border-bottom: 1px solid #334155;">
        <td style="padding: 10px; font-family: monospace; color: #f8fafc; font-size: 13px;">${inv.invoice_number}</td>
        <td style="padding: 10px; color: #cbd5e1; font-size: 13px;">${inv.plan_name}</td>
        <td style="padding: 10px; color: #f43f5e; font-weight: bold; font-size: 13px; text-align: right;">$${parseFloat(inv.amount).toFixed(2)}</td>
      </tr>
    `).join("");

    const mailOptions = {
      from: `"CallAutomate Billing" <${smtpUser}>`,
      to: recipientEmail,
      subject: `Action Required: Unpaid Invoice Notice ($${totalAmount.toFixed(2)}) - CallAutomate AI`,
      text: `Hello ${user?.full_name || "Customer"},\n\nYou have ${unpaidInvoices.length} unpaid bill(s) totaling $${totalAmount.toFixed(2)} on CallAutomate AI.\n\nPlease complete payment to keep your active phone numbers and AI voice agents online:\n${billingUrl}\n\nThank you,\nCallAutomate Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Unpaid Invoice Alert</title>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .card { background-color: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: 800; color: #06b6d4; margin-bottom: 8px; }
            .badge { display: inline-block; background-color: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.4); color: #f43f5e; padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
            h1 { font-size: 20px; font-weight: 700; color: #f8fafc; margin-top: 16px; margin-bottom: 12px; }
            p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-top: 0; margin-bottom: 20px; }
            .table-container { background-color: #0f172a; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #334155; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 8px 10px; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; }
            .cta-button { display: block; text-align: center; background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); color: #ffffff !important; padding: 14px 24px; border-radius: 12px; font-size: 15px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4); margin-bottom: 24px; }
            .footer { text-align: center; font-size: 12px; color: #475569; border-top: 1px solid #334155; padding-top: 20px; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">CallAutomate AI</div>
                <div class="badge">Unpaid Bill Warning</div>
              </div>
              
              <h1>Hello ${user?.full_name || "Customer"},</h1>
              <p>You have <strong>${unpaidInvoices.length} outstanding invoice(s)</strong> totaling <strong style="color: #f43f5e;">$${totalAmount.toFixed(2)}</strong>. Please complete payment to avoid service suspension for your phone numbers and AI agents.</p>
              
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Item Details</th>
                      <th style="text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${invoiceRowsHtml}
                  </tbody>
                </table>
              </div>
              
              <a href="${billingUrl}" class="cta-button">Pay Now ($${totalAmount.toFixed(2)})</a>
              
              <p style="margin-bottom: 0; font-size: 13px;">If you have already settled this bill, please log into your CallAutomate portal to view your receipt.</p>
              
              <div class="footer">
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} CallAutomate AI. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[send-unpaid-alert] Email successfully sent to ${recipientEmail}. Message ID: ${info.messageId}`);

    return NextResponse.json({
      success: true,
      message: `Unpaid invoice alert email successfully sent to ${recipientEmail}`,
      messageId: info.messageId,
      recipientEmail,
      totalAmount,
      unpaidCount: unpaidInvoices.length,
    });
  } catch (err: any) {
    console.error("[POST /api/billing/send-unpaid-alert]", err);
    return NextResponse.json({ error: err.message || "Failed to send email alert" }, { status: 500 });
  }
}
