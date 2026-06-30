// src/app/api/auth/verify-email/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { verifyRequestJwt } from "@/lib/jwt-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch current user info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name, is_email_verified")
      .eq("id", payload.sub)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.is_email_verified) {
      return NextResponse.json({ error: "Email is already verified." }, { status: 400 });
    }

    // 2. Generate a secure random verification token
    const token = crypto.randomUUID();

    // 3. Update token in the users database table
    const { error: updateError } = await supabase
      .from("users")
      .update({
        email_verification_token: token,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[verify-email/send] DB update error:", updateError);
      return NextResponse.json({ error: "Failed to create verification token." }, { status: 500 });
    }

    // 4. Resolve SMTP Settings
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER || "support@callautomate.ai";
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpPass) {
      console.error("[verify-email/send] Missing SMTP server settings in env.");
      return NextResponse.json({ error: "Email service misconfiguration." }, { status: 500 });
    }

    // 5. Create Nodemailer Transport
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });

    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: `"CallAutomate Support" <${smtpUser}>`,
      to: user.email,
      subject: "Verify Your CallAutomate Email Address",
      text: `Hello ${user.full_name || "Customer"},\n\nPlease verify your email address by clicking the link below:\n\n${verificationLink}\n\nThis verification link will expire shortly.\n\nBest regards,\nThe CallAutomate Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email</title>
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
              background-color: rgba(6, 182, 212, 0.1);
              border: 1px solid rgba(6, 182, 212, 0.2);
              color: #06b6d4;
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
              margin-top: 32px;
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
                <div class="badge">Security Verification</div>
              </div>
              
              <h1>Hello ${user.full_name || "Customer"},</h1>
              <p>Thank you for using CallAutomate. To secure your account and verify your email address, please click the button below:</p>
              
              <a href="${verificationLink}" class="cta-button">Verify Email Address</a>
              
              <p>If the button doesn't work, copy and paste this URL into your web browser:</p>
              <p style="word-break: break-all; font-size: 13px; color: #06b6d4;">${verificationLink}</p>
              
              <p style="margin-bottom: 0;">If you did not make this request, you can safely ignore this email.</p>
              
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

    const info = await transporter.sendMail(mailOptions);
    console.log(`[verify-email/send] Sent verification email to ${user.email}. ID: ${info.messageId}`);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error("[verify-email/send] Error sending email:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
