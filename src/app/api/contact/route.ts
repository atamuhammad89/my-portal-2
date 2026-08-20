// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, company, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required fields." },
        { status: 400 }
      );
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER || "support@callautomate.ai";
    const smtpPass = process.env.SMTP_PASS;

    // Log contact request payload to console for audit trailing
    console.log(`[contact-form] Received inquiry from ${name} (${email}):`, {
      phone: phone || "N/A",
      company: company || "N/A",
      message,
    });

    if (smtpHost && smtpPass) {
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

      const mailOptions = {
        from: `"CallAutomate Contact Form" <${smtpUser}>`,
        to: smtpUser,
        replyTo: email,
        subject: `New Contact Inquiry from ${name} (${company || "Individual"})`,
        text: `New Contact Inquiry:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "N/A"}\nCompany: ${company || "N/A"}\n\nMessage:\n${message}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>New Contact Inquiry</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
              <h2 style="color: #0f172a; margin-top: 0;">New Contact Form Message</h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr><td style="padding: 6px 0; color: #64748b; font-[bold];">Name:</td><td style="color: #0f172a;">${name}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-[bold];">Email:</td><td style="color: #0f172a;"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-[bold];">Phone:</td><td style="color: #0f172a;">${phone || "N/A"}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-[bold];">Company:</td><td style="color: #0f172a;">${company || "N/A"}</td></tr>
              </table>
              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <h4 style="margin: 0 0 8px 0; color: #1e293b;">Message:</h4>
                <p style="margin: 0; color: #334155; white-space: pre-wrap;">${message}</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[contact-form] Email dispatched successfully to ${smtpUser}`);
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been received. Our team will get back to you shortly.",
    });
  } catch (err: any) {
    console.error("[/api/contact] Error processing contact form:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to submit message." },
      { status: 500 }
    );
  }
}
