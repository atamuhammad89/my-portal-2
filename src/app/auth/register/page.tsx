"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2, User, Mail, Lock, AlertCircle, PhoneCall, Headset, Calendar, Sparkles, ShieldCheck, ExternalLink, HelpCircle, Briefcase, HeartPulse, Utensils, Users, Star, BarChart3 } from "lucide-react";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import { CallAutomateLogoIcon } from "@/components/shared/call-automate-logo";
import { AuthLayout } from "@/components/auth/AuthLayout";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Include at least one uppercase letter.";
  if (!(/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw))) {
    return "Include at least one number or special character.";
  }
  return null;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("session_id") ?? "";
  const planId = searchParams.get("plan_id") ?? "";
  const planName = searchParams.get("plan_name") ?? "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isFreeTrial =
    searchParams.get("plan") === "free_trial" ||
    planName === "free_trial" ||
    planId === "free_trial" ||
    (!sessionId && !planId && !planName);

  const handleSubmit = async () => {
    setErrorMsg(null);
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) return setErrorMsg("Full name is required.");
    if (!trimmedEmail) return setErrorMsg("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
      return setErrorMsg("Enter a valid email address.");

    const pwError = validatePassword(password);
    if (pwError) return setErrorMsg(pwError);

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: trimmedName,
          email: trimmedEmail,
          password,
          plan_id: planId,
          plan_name: planName,
          stripe_session_id: sessionId,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Webhook returned ${res.status}.`);
      }

      setSuccess(true);
      setTimeout(() => router.replace("/auth/login?checkout=success"), 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !submitting) handleSubmit();
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center py-5">
          <div
            className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border"
            style={{
              background: "var(--success-bg)",
              borderColor: "rgba(52, 211, 153, 0.3)",
            }}
          >
            <CheckCircle2 className="h-6 w-6" style={{ color: "var(--success-fg)" }} />
          </div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--foreground)" }}>
            Account Created! 🎉
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted-text)" }}>
            Redirecting you to sign in…
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Brand logo header inside card */}
      <div className="flex flex-col items-center text-center mb-3">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <CallAutomateLogoIcon className="w-6 h-6 shrink-0" size={24} />
          <span className="text-base font-black tracking-tight" style={{ color: "var(--foreground)" }}>
            Call<span className="text-[var(--brand-500)]">Automate</span>
          </span>
        </div>

        <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Create your CallAutomate Account 🚀</h1>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-text)" }}>
          Start your 30-Day Free Trial today. No credit card required.
        </p>
      </div>

      {/* Plan confirmation banner */}
      {isFreeTrial && (
        <div
          className="mb-3 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold flex items-center gap-1.5 shadow-sm border"
          style={{
            background: "var(--success-bg)",
            borderColor: "rgba(52, 211, 153, 0.3)",
            color: "var(--success-fg)",
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--success-fg)" }} />
          <span>
            🎁 <strong>30-Day Free Trial ($0, no card needed)</strong> — the only platform offering <strong>50 AI call minutes for free</strong>!
          </span>
        </div>
      )}

      {planName && !isFreeTrial && (
        <div
          className="mb-3 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold flex items-center gap-1.5 shadow-sm border"
          style={{
            background: "var(--success-bg)",
            borderColor: "rgba(52, 211, 153, 0.3)",
            color: "var(--success-fg)",
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--success-fg)" }} />
          <span>
            Payment successful! Joining on <strong>{capitalize(planName)}</strong>.
          </span>
        </div>
      )}

      {/* Google OAuth Button */}
      <div className="mb-3">
        <GoogleSignInButton label="Sign up with Google" onError={(err) => setErrorMsg(err)} />
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center mb-3">
        <div className="w-full border-t" style={{ borderColor: "var(--border)" }} />
        <span
          className="absolute px-2 text-[8px] font-bold uppercase tracking-wider"
          style={{ background: "var(--surface)", color: "var(--subtle-text)" }}
        >
          OR SIGN UP WITH EMAIL
        </span>
      </div>

      {/* Form controls */}
      <div className="space-y-2" onKeyDown={handleKeyDown}>
        {/* Full Name */}
        <div>
          <label className="block text-[10px] font-bold mb-0.5" style={{ color: "var(--muted-text)" }}>
            Full Name
          </label>
          <div className="relative">
            <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--subtle-text)" }} />
            <input
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all border"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--brand-500)";
                e.currentTarget.style.boxShadow = "0 0 0 2px var(--brand-100)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-[10px] font-bold mb-0.5" style={{ color: "var(--muted-text)" }}>
            Email
          </label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--subtle-text)" }} />
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all border"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--brand-500)";
                e.currentTarget.style.boxShadow = "0 0 0 2px var(--brand-100)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[10px] font-bold mb-0.5" style={{ color: "var(--muted-text)" }}>
            Password
          </label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--subtle-text)" }} />
            <input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full pl-8 pr-8 py-1.5 rounded-lg text-xs outline-none transition-all border"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--brand-500)";
                e.currentTarget.style.boxShadow = "0 0 0 2px var(--brand-100)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
              style={{ color: "var(--subtle-text)" }}
              tabIndex={-1}
            >
              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Error notice */}
        {errorMsg && (
          <div
            className="p-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border"
            style={{
              background: "var(--danger-bg)",
              borderColor: "rgba(244, 63, 94, 0.3)",
              color: "var(--danger-fg)",
            }}
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--danger-fg)" }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !fullName || !email || !password}
          className="w-full py-2.5 rounded-lg font-extrabold text-xs transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer flex items-center justify-center gap-2 mt-1"
          style={{
            background: "var(--brand-500)",
            color: "var(--brand-btn-text)",
            boxShadow: "var(--brand-btn-shadow)",
          }}
          onMouseEnter={(e) => {
            if (!submitting) {
              e.currentTarget.style.boxShadow = "var(--brand-btn-shadow-hover)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "var(--brand-btn-shadow)";
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Creating account…</span>
            </>
          ) : (
            <span>Create account →</span>
          )}
        </button>
      </div>

      {/* Footer navigation links */}
      <div className="mt-3 pt-2.5 border-t text-center space-y-1.5" style={{ borderColor: "var(--border)" }}>
        <div>
          <Link
            href="/auth/login"
            className="text-[11px] font-bold hover:underline"
            style={{ color: "var(--brand-500)" }}
          >
            Already have an account? Sign in
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10px] font-semibold">
          <Link
            href="/"
            className="hover:underline transition-colors"
            style={{ color: "var(--subtle-text)" }}
          >
            Homepage
          </Link>
          <span style={{ color: "var(--border)" }}>•</span>
          <Link
            href="/pricing"
            className="hover:underline transition-colors"
            style={{ color: "var(--subtle-text)" }}
          >
            Pricing &amp; Plans
          </Link>
          <span style={{ color: "var(--border)" }}>•</span>
          <Link
            href="/#features"
            className="hover:underline transition-colors"
            style={{ color: "var(--subtle-text)" }}
          >
            Voice Features
          </Link>
        </div>
      </div>

      {/* SEO & AEO Content Alignment: How Voice Automation & 24/7 Support Work */}
      <section className="mt-4 pt-3.5 border-t space-y-2.5 text-left" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-500)" }} />
          <h2 className="text-xs font-bold" style={{ color: "var(--foreground)" }}>
            What Benefits Do You Get With Your CallAutomate Free Trial Registration?
          </h2>
        </div>

        <p className="text-[10px] leading-relaxed" style={{ color: "var(--muted-text)" }}>
          Registering for a CallAutomate account grants you instant access to our next-generation cloud telephony and voice automation platform. Designed for modern enterprises and growing businesses across North America, Europe, and the UK, CallAutomate enables teams to build, test, and deploy autonomous AI voice agents that automate customer inbound and outbound calls, qualify leads 24/7, and manage appointment scheduling seamlessly.
        </p>

        <div className="space-y-2 pt-0.5">
          {/* Social Proof & Customer Testimonials */}
          <div className="p-2.5 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1 font-semibold" style={{ color: "var(--foreground)" }}>
                <Users className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-500)" }} />
                <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
                  Trusted by 10,000+ Businesses Worldwide
                </h2>
              </div>
              <div className="flex items-center gap-0.5 text-amber-400 text-[9px] font-bold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>4.9/5 Rating</span>
              </div>
            </div>
            
            <div className="space-y-1.5 pt-0.5">
              <blockquote className="p-2 rounded-md border text-[9px] italic leading-normal" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted-text)" }}>
                &ldquo;CallAutomate completely transformed our call operations. We automated over 15,000 monthly appointment confirmation calls without adding staff.&rdquo;
                <footer className="mt-1 not-italic font-bold text-[8.5px] flex items-center justify-between" style={{ color: "var(--foreground)" }}>
                  <span>— Sarah Jenkins, VP of Operations at Apex Health</span>
                  <span className="text-[8px] font-semibold" style={{ color: "var(--brand-500)" }}>Verified Customer</span>
                </footer>
              </blockquote>
            </div>
          </div>

          {/* Competitive Differentiators */}
          <div className="p-2.5 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1 font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
                Why Choose CallAutomate Over Other Voice AI Platforms?
              </h2>
            </div>
            <ul className="space-y-1.5 pl-0.5 text-[9.5px] leading-normal" style={{ color: "var(--muted-text)" }}>
              <li className="flex items-start gap-1.5">
                <span className="font-bold shrink-0" style={{ color: "var(--brand-500)" }}>✓</span>
                <span>
                  <strong>50 Free AI Call Minutes:</strong> CallAutomate is the only voice automation platform offering 50 AI call minutes completely free upon registration so your team can test live voice agents at zero upfront cost.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold shrink-0" style={{ color: "var(--brand-500)" }}>✓</span>
                <span>
                  <strong>Dedicated Success Manager:</strong> Enterprise plans include a dedicated success manager responsible for custom workflow onboarding, tailored SLA guarantees, line provisioning, and 24/7 priority support.
                </span>
              </li>
            </ul>
          </div>

          {/* Plan Comparison & Performance Metrics Data Visual Table */}
          <div className="pt-2 border-t mt-2 text-[10px]" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1 font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
              <BarChart3 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
                CallAutomate Plan Comparison &amp; AI Performance Data Visuals
              </h2>
            </div>
            
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-left text-[9px]" style={{ background: "var(--surface-2)", color: "var(--foreground)" }}>
                <thead>
                  <tr className="border-b font-bold text-[8.5px] uppercase tracking-wider" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <th className="p-1.5">Feature</th>
                    <th className="p-1.5 text-center">Free Trial</th>
                    <th className="p-1.5 text-center">Growth</th>
                    <th className="p-1.5 text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  <tr>
                    <td className="p-1.5 font-medium">Free AI Minutes</td>
                    <td className="p-1.5 text-center font-bold" style={{ color: "var(--brand-500)" }}>50 Mins</td>
                    <td className="p-1.5 text-center">500 Mins</td>
                    <td className="p-1.5 text-center font-semibold">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-medium">Voice Response Time</td>
                    <td className="p-1.5 text-center">&lt; 300ms</td>
                    <td className="p-1.5 text-center">&lt; 250ms</td>
                    <td className="p-1.5 text-center font-bold" style={{ color: "var(--brand-500)" }}>&lt; 150ms</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-medium">Dedicated Manager</td>
                    <td className="p-1.5 text-center text-rose-500 font-bold">✕</td>
                    <td className="p-1.5 text-center text-rose-500 font-bold">✕</td>
                    <td className="p-1.5 text-center font-bold text-emerald-500">✓ Included</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-medium">Security &amp; ISO 27001</td>
                    <td className="p-1.5 text-center font-semibold text-emerald-500">✓ Included</td>
                    <td className="p-1.5 text-center font-semibold text-emerald-500">✓ Included</td>
                    <td className="p-1.5 text-center font-semibold text-emerald-500">✓ Included</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature 1: How Automated Customer Calls Work */}
          <div className="p-2 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1 font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
              <PhoneCall className="w-3 h-3 shrink-0" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
                How Do Automated Customer Calls &amp; Telephony Work?
              </h2>
            </div>
            <p className="text-[9.5px] leading-normal" style={{ color: "var(--muted-text)" }}>
              Provision local, national, or toll-free phone numbers globally over{" "}
              <a
                href="https://webrtc.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80 font-medium inline-flex items-center gap-0.5"
                style={{ color: "var(--brand-500)" }}
              >
                WebRTC
                <ExternalLink className="w-2.5 h-2.5 inline" />
              </a>{" "}
              telephony bridges. Assign customized AI voice agents powered by{" "}
              <a
                href="https://openai.com/research/whisper"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80 font-medium inline-flex items-center gap-0.5"
                style={{ color: "var(--brand-500)" }}
              >
                OpenAI Whisper
                <ExternalLink className="w-2.5 h-2.5 inline" />
              </a>{" "}
              automatic speech recognition (ASR) and neural text-to-speech (TTS) engines to handle complex customer queries with sub-300ms natural conversational latency.
            </p>
          </div>

          {/* Feature 2: How 24/7 Intelligent Support Works */}
          <div className="p-2 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1 font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
              <Headset className="w-3 h-3 shrink-0" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
                How Does 24/7 Virtual Receptionist &amp; Security Compliance Work?
              </h2>
            </div>
            <p className="text-[9.5px] leading-normal" style={{ color: "var(--muted-text)" }}>
              Deploy virtual receptionists operating under certified{" "}
              <a
                href="https://www.iso.org/isoiec-27001-information-security.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80 font-medium inline-flex items-center gap-0.5"
                style={{ color: "var(--brand-500)" }}
              >
                ISO 27001
                <ExternalLink className="w-2.5 h-2.5 inline" />
              </a>{" "}
              information security frameworks and strict{" "}
              <a
                href="https://gdpr.eu/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80 font-medium inline-flex items-center gap-0.5"
                style={{ color: "var(--brand-500)" }}
              >
                GDPR
                <ExternalLink className="w-2.5 h-2.5 inline" />
              </a>{" "}
              data privacy compliance. CallAutomate ensures end-to-end media encryption and zero unauthorized data retention while delivering 365-day continuous call availability without queue delays or missed leads.
            </p>
          </div>

          {/* Feature 3: Automated Appointment Scheduling */}
          <div className="p-2 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1 font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
              <Calendar className="w-3 h-3 shrink-0" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
                How Does Automated Calendar &amp; SSO Synchronization Work?
              </h2>
            </div>
            <p className="text-[9.5px] leading-normal" style={{ color: "var(--muted-text)" }}>
              Integrate Google Calendar, Outlook, Salesforce, or HubSpot CRM via webhooks and authenticate corporate users securely through{" "}
              <a
                href="https://developers.google.com/identity/protocols/oauth2"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80 font-medium inline-flex items-center gap-0.5"
                style={{ color: "var(--brand-500)" }}
              >
                Google OAuth 2.0
                <ExternalLink className="w-2.5 h-2.5 inline" />
              </a>{" "}
              SSO protocols. AI agents verify real-time calendar slot availability, resolve schedule conflicts, and dispatch instant SMS or email booking confirmations automatically.
            </p>
          </div>

          {/* Industry Use Cases & Real-World Examples */}
          <div className="pt-2 border-t mt-2 text-[10px]" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1 font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
              <Briefcase className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
                Proven Industry Use Cases &amp; Real-World Applications
              </h2>
            </div>
            <div className="space-y-2">
              {/* Healthcare Use Case */}
              <div className="p-2 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-1 font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
                  <HeartPulse className="w-3 h-3 shrink-0 text-red-500" />
                  <h3 className="text-[9.5px] font-bold inline" style={{ color: "var(--foreground)" }}>
                    Healthcare &amp; Clinical Medical Practices
                  </h3>
                </div>
                <p className="text-[9px] leading-normal" style={{ color: "var(--muted-text)" }}>
                  Medical clinics and dental practices use CallAutomate to field inbound patient inquiry calls, schedule appointment slots, and deliver automated appointment reminders—reducing no-shows by 40% and freeing clinical staff for patient care.
                </p>
              </div>

              {/* Restaurants & Hospitality Use Case */}
              <div className="p-2 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-1 font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
                  <Utensils className="w-3 h-3 shrink-0 text-amber-500" />
                  <h3 className="text-[9.5px] font-bold inline" style={{ color: "var(--foreground)" }}>
                    Restaurants, Dining &amp; Hospitality
                  </h3>
                </div>
                <p className="text-[9px] leading-normal" style={{ color: "var(--muted-text)" }}>
                  High-volume dining establishments deploy AI receptionists to handle phone reservations, answer menu questions, and take takeout order inquiries during peak dining hours without putting callers on hold.
                </p>
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions (FAQ) Section */}
          <div className="pt-2 border-t mt-2 text-[10px]" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1 font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
              <HelpCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
                Frequently Asked Questions About CallAutomate Registration
              </h2>
            </div>
            <div className="space-y-2">
              <div className="p-2 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <h4 className="font-bold text-[9.5px] mb-0.5" style={{ color: "var(--foreground)" }}>
                  What happens after the 30-day free trial?
                </h4>
                <p className="text-[9px] leading-normal" style={{ color: "var(--muted-text)" }}>
                  When your 30-day free trial ends (or after using your 50 free AI call minutes), your account remains active and all agent configurations, phone numbers, and call analytics are preserved. You can select a paid plan to keep dispatching calls—no charges occur automatically without your explicit selection.
                </p>
              </div>

              <div className="p-2 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <h4 className="font-bold text-[9.5px] mb-0.5" style={{ color: "var(--foreground)" }}>
                  Can I upgrade or change my plan later?
                </h4>
                <p className="text-[9px] leading-normal" style={{ color: "var(--muted-text)" }}>
                  Yes, you can upgrade, downgrade, or customize your plan at any time directly in your account billing portal. Upgrading to an Enterprise plan immediately pairs your organization with a dedicated success manager for customized setup and support.
                </p>
              </div>
            </div>
          </div>

          {/* Internal Links Site Architecture Grid */}
          <div className="pt-2 border-t mt-2 text-[10px]" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-bold mb-1.5 text-[10px]" style={{ color: "var(--foreground)" }}>
              Where Can You Explore CallAutomate Platform Architecture?
            </h2>
            <div className="grid grid-cols-2 gap-1.5">
              <Link
                href="/"
                className="p-1.5 rounded-lg border flex items-center justify-between transition-colors hover:border-[var(--brand-500)]"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <span className="font-medium text-[9.5px]">Home Platform</span>
                <span className="text-[9px]" style={{ color: "var(--brand-500)" }}>→</span>
              </Link>
              <Link
                href="/pricing"
                className="p-1.5 rounded-lg border flex items-center justify-between transition-colors hover:border-[var(--brand-500)]"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <span className="font-medium text-[9.5px]">Pricing &amp; Plans</span>
                <span className="text-[9px]" style={{ color: "var(--brand-500)" }}>→</span>
              </Link>
              <Link
                href="/#features"
                className="p-1.5 rounded-lg border flex items-center justify-between transition-colors hover:border-[var(--brand-500)]"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <span className="font-medium text-[9.5px]">Voice Features</span>
                <span className="text-[9px]" style={{ color: "var(--brand-500)" }}>→</span>
              </Link>
              <Link
                href="/auth/login"
                className="p-1.5 rounded-lg border flex items-center justify-between transition-colors hover:border-[var(--brand-500)]"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <span className="font-medium text-[9.5px]">Account Sign In</span>
                <span className="text-[9px]" style={{ color: "var(--brand-500)" }}>→</span>
              </Link>
            </div>
          </div>

          {/* Customer Support & Contact Info Banner */}
          <div className="pt-2 border-t mt-2 text-[10px]" style={{ borderColor: "var(--border)" }}>
            <div className="p-2 rounded-lg border flex items-center justify-between gap-2" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-500)" }} />
                <div>
                  <h3 className="font-bold text-[9.5px]" style={{ color: "var(--foreground)" }}>
                    Need Help or Dedicated Support?
                  </h3>
                  <p className="text-[8.5px]" style={{ color: "var(--muted-text)" }}>
                    Contact our 24/7 technical team for assistance.
                  </p>
                </div>
              </div>
              <a
                href="mailto:support@callautomate.ai"
                className="px-2 py-1 rounded-md text-[9px] font-bold border transition-colors hover:border-[var(--brand-500)] shrink-0"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--brand-500)" }}
              >
                support@callautomate.ai
              </a>
            </div>
          </div>
        </div>
      </section>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
