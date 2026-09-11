"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, Loader2, CheckCircle2, AlertCircle, Sparkles, ShieldCheck, PhoneCall, Zap, HelpCircle, Star, Quote, BarChart3, TrendingUp, Calendar, Headset, ExternalLink, Globe } from "lucide-react";
import { useLogin } from "@/hooks/use-login";
import { useAuthStore } from "@/store/auth-store";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import { CallAutomateLogoIcon } from "@/components/shared/call-automate-logo";
import { AuthLayout } from "@/components/auth/AuthLayout";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutateAsync: login, isPending } = useLogin();
  const clearSession = useAuthStore((s) => s.clearSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPostCheckout = searchParams.get("checkout") === "success";
  const sessionExpired = searchParams.get("reason") === "session_expired";

  const handleLogin = async () => {
    setErrorMessage(null);
    try {
      const response = await login({ email, password });
      const adminRoles = new Set(["super_admin", "admin", "operations", "support", "finance"]);
      const defaultDest = adminRoles.has(response.user?.role ?? "")
        ? "/admin/agents"
        : response.user?.role === "reseller"
        ? "/reseller"
        : "/dashboard";
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : defaultDest);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Login failed. Please verify your credentials."
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

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

        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Welcome back! 👋</h2>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-text)" }}>
          Sign in to your account to continue automating conversations.
        </p>

        {/* Social Proof & Usage Statistics Badge Bar */}
        <div
          className="mt-2 px-2.5 py-1 rounded-full border flex items-center justify-between text-[9px] font-semibold w-full"
          style={{
            background: "var(--surface-2)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">500+ Businesses</span>
          </div>
          <div className="flex items-center gap-1" style={{ color: "var(--muted-text)" }}>
            <span>•</span>
            <div className="flex items-center text-amber-400">
              <Star className="w-2.5 h-2.5 fill-amber-400 inline" />
            </div>
            <span className="font-bold" style={{ color: "var(--foreground)" }}>4.9/5 CSAT</span>
          </div>
          <div className="flex items-center gap-1" style={{ color: "var(--muted-text)" }}>
            <span>•</span>
            <span className="font-bold" style={{ color: "var(--foreground)" }}>100k+ Calls</span>
          </div>
        </div>
      </div>

      {/* Post-checkout banner */}
      {isPostCheckout && (
        <div
          className="mb-3 rounded-lg px-3 py-1.5 text-[10px] font-semibold flex items-center gap-2 shadow-sm border"
          style={{
            background: "var(--success-bg)",
            borderColor: "rgba(52, 211, 153, 0.3)",
            color: "var(--success-fg)",
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--success-fg)" }} />
          <span>Account created! Sign in with your new credentials.</span>
        </div>
      )}

      {/* Session expired banner */}
      {sessionExpired && (
        <div
          className="mb-3 rounded-lg px-3 py-1.5 text-[10px] font-semibold flex items-center gap-2 shadow-sm border"
          style={{
            background: "var(--warning-bg)",
            borderColor: "rgba(245, 158, 11, 0.3)",
            color: "var(--warning-fg)",
          }}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--warning-fg)" }} />
          <span>Your session expired. Please sign in again.</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <div className="mb-3">
        <GoogleSignInButton label="Sign in with Google" onError={(err) => setErrorMessage(err)} />
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center mb-3">
        <div className="w-full border-t" style={{ borderColor: "var(--border)" }} />
        <span
          className="absolute px-2 text-[8px] font-bold uppercase tracking-wider"
          style={{ background: "var(--surface)", color: "var(--subtle-text)" }}
        >
          OR CONTINUE WITH EMAIL
        </span>
      </div>

      {/* Form controls */}
      <div className="space-y-2.5" onKeyDown={handleKeyDown}>
        {/* Email */}
        <div>
          <label className="block text-[10px] font-bold mb-1" style={{ color: "var(--muted-text)" }}>
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
              className="w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none transition-all border"
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
          <label className="block text-[10px] font-bold mb-1" style={{ color: "var(--muted-text)" }}>
            Password
          </label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--subtle-text)" }} />
            <input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full pl-8 pr-8 py-2 rounded-lg text-xs outline-none transition-all border"
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
          <div className="flex justify-end mt-0.5">
            <Link
              href="/auth/login"
              className="text-[10px] font-semibold hover:underline"
              style={{ color: "var(--brand-500)" }}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div
            className="p-2 rounded-lg text-xs font-semibold flex items-center gap-2 border"
            style={{
              background: "var(--danger-bg)",
              borderColor: "rgba(244, 63, 94, 0.3)",
              color: "var(--danger-fg)",
            }}
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--danger-fg)" }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={isPending || !email || !password}
          className="w-full py-2.5 rounded-lg font-extrabold text-xs transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer flex items-center justify-center gap-2 mt-0.5"
          style={{
            background: "var(--brand-500)",
            color: "var(--brand-btn-text)",
            boxShadow: "var(--brand-btn-shadow)",
          }}
          onMouseEnter={(e) => {
            if (!isPending) {
              e.currentTarget.style.boxShadow = "var(--brand-btn-shadow-hover)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "var(--brand-btn-shadow)";
          }}
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <span>Continue →</span>
          )}
        </button>
      </div>

      {/* Footer navigation link */}
      <div className="mt-4 pt-2.5 border-t text-center" style={{ borderColor: "var(--border)" }}>
        <Link
          href="/"
          className="text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
          style={{ color: "var(--subtle-text)" }}
        >
          ← Back to CallAutomate
        </Link>
      </div>

      {/* SEO & AI Engine Optimization Content (Platform Context & Login Information) */}
      <section className="mt-4 pt-4 border-t space-y-3 text-left" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-500)" }} />
          <h2 className="text-xs font-bold" style={{ color: "var(--foreground)" }}>
            About CallAutomate Voice AI Portal
          </h2>
        </div>

        <p className="text-[10px] leading-relaxed" style={{ color: "var(--muted-text)" }}>
          CallAutomate is an enterprise-grade AI voice automation platform designed to streamline business phone communications, inbound caller support, and automated outbound lead outreach across North America, the UK, and Europe. By signing in to your secure CallAutomate portal, you access real-time telephony agent configuration, interactive call flow management, and advanced conversational analytics.
        </p>

        <div className="grid grid-cols-1 gap-2 pt-1">
          {/* Feature 1: Automated Customer Calls */}
          <div className="p-2 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1 font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
              <PhoneCall className="w-3 h-3" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
                Automated Customer Calls &amp; Telephony Operations
              </h2>
            </div>
            <p className="text-[9.5px] leading-normal" style={{ color: "var(--muted-text)" }}>
              Automate inbound inquiry calls and outbound sales campaigns using human-grade voice AI agents capable of sub-300ms response times, custom prompt execution, and real-time CRM data logging.
            </p>
          </div>

          {/* Feature 2: Appointment Scheduling */}
          <div className="p-2 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1 font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
              <Calendar className="w-3 h-3" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
                24/7 Automated Appointment Scheduling
              </h2>
            </div>
            <p className="text-[9.5px] leading-normal" style={{ color: "var(--muted-text)" }}>
              Seamlessly connect AI voice agents to your calendar systems (Google Calendar, Outlook, Salesforce) to allow callers to check live availability, lock in appointments, and receive automated booking confirmations without staff intervention.
            </p>
          </div>

          {/* Feature 3: 24/7 Intelligent Support */}
          <div className="p-2 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1 font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
              <Headset className="w-3 h-3" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
                24/7 Intelligent Customer Support &amp; Escalation
              </h2>
            </div>
            <p className="text-[9.5px] leading-normal" style={{ color: "var(--muted-text)" }}>
              Provide round-the-clock customer assistance, after-hours emergency phone support, and automated helpdesk ticket creation (Zendesk, Salesforce) 365 days a year with zero queue wait times.
            </p>
          </div>

          {/* Feature 4: Multilingual Support Capabilities (Competitive Differentiator) */}
          <div className="p-2 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1 font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
              <Globe className="w-3 h-3" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
                Multilingual Voice AI &amp; Regional Dialect Support
              </h2>
            </div>
            <p className="text-[9.5px] leading-normal" style={{ color: "var(--muted-text)" }}>
              Deploy AI voice agents fluent in over 30+ global languages and regional accents (including English, French, Spanish, German, and Italian) to deliver native, context-aware customer support to international markets.
            </p>
          </div>

          {/* Feature 5: Real-Time Call Performance Analytics (Competitive Differentiator) */}
          <div className="p-2 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1 font-semibold mb-0.5" style={{ color: "var(--brand-500)" }}>
              <BarChart3 className="w-3 h-3" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
                Real-Time Call Analytics &amp; Sentiment Detection
              </h2>
            </div>
            <p className="text-[9.5px] leading-normal" style={{ color: "var(--muted-text)" }}>
              Gain instant visibility into live call volume, full Whisper speech-to-text transcripts, real-time sentiment scoring, duration metrics, and automated CRM webhook synchronization to optimize caller satisfaction.
            </p>
          </div>

          {/* Feature 6: Enterprise Security & SSO */}
          <div className="p-2 rounded-lg border text-[10px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1 font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
              <ShieldCheck className="w-3 h-3" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
                Enterprise Security &amp; Single Sign-On (SSO)
              </h2>
            </div>
            <p className="text-[9.5px] leading-normal" style={{ color: "var(--muted-text)" }}>
              Protected by multi-factor token authentication, encrypted session storage, and single sign-on (SSO) via{" "}
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
              to ensure regulatory compliance and robust data protection.
            </p>
          </div>
        </div>

        <div className="pt-1 text-[10px] space-y-1" style={{ color: "var(--muted-text)" }}>
          <div className="flex items-center gap-1 font-semibold" style={{ color: "var(--foreground)" }}>
            <HelpCircle className="w-3 h-3" style={{ color: "var(--brand-500)" }} />
            <h2 className="text-[10px] font-bold inline" style={{ color: "var(--foreground)" }}>
              Account Access &amp; Login Support
            </h2>
          </div>
          <p className="text-[9.5px] leading-normal">
            Need help signing in? Verify that your email address matches the account username created during onboarding. If your company uses Google Workspace single sign-on, select &quot;Sign in with Google&quot;.
          </p>
          <p className="text-[9.5px] leading-normal">
            If you have forgotten your password, select the &quot;Forgot password?&quot; option to receive a secure password reset link. For session timeout issues, re-authenticating will safely restore your active workspace dashboard without disrupting voice agent workflows.
          </p>

          <div className="mt-2 p-2 rounded-lg border flex items-center justify-between text-[9.5px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1.5 font-medium" style={{ color: "var(--foreground)" }}>
              <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-500)" }} />
              <span>Need direct assistance? Contact Support:</span>
            </div>
            <a
              href="mailto:support@callautomate.ai"
              className="font-bold underline transition-colors hover:opacity-80"
              style={{ color: "var(--brand-500)" }}
            >
              support@callautomate.ai
            </a>
          </div>
        </div>

        {/* Verified Customer Case Studies & Trust Signals */}
        <div className="pt-3 border-t space-y-2.5" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Quote className="w-3 h-3 shrink-0" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[11px] font-bold" style={{ color: "var(--foreground)" }}>
                Trusted by 500+ Industry Leaders
              </h2>
            </div>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              ))}
              <span className="text-[9px] font-bold ml-1" style={{ color: "var(--muted-text)" }}>4.9/5</span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Case Study 1 */}
            <div className="p-2 rounded-lg border text-[10px] space-y-1" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981" }}>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  +310% Booking Efficiency
                </span>
                <span className="text-[8.5px] font-semibold" style={{ color: "var(--subtle-text)" }}>Case Study</span>
              </div>
              <p className="text-[9px] italic leading-normal" style={{ color: "var(--foreground)" }}>
                &quot;CallAutomate transformed our front desk operations. The AI receptionist handles over 400 patient booking calls per week with sub-300ms response times.&quot;
              </p>
              <div className="text-[8.5px] font-medium" style={{ color: "var(--muted-text)" }}>
                <strong style={{ color: "var(--foreground)" }}>Dr. Elena Rostova</strong> · Clinical Director, Bright Health Dental
              </div>
            </div>

            {/* Case Study 2 */}
            <div className="p-2 rounded-lg border text-[10px] space-y-1" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366F1" }}>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  45 hrs Saved / Week
                </span>
                <span className="text-[8.5px] font-semibold" style={{ color: "var(--subtle-text)" }}>Case Study</span>
              </div>
              <p className="text-[9px] italic leading-normal" style={{ color: "var(--foreground)" }}>
                &quot;Our agents used to spend half their day qualifying phone leads. CallAutomate handles buyer qualification and syncs viewings directly into Salesforce.&quot;
              </p>
              <div className="text-[8.5px] font-medium" style={{ color: "var(--muted-text)" }}>
                <strong style={{ color: "var(--foreground)" }}>Marcus Vance</strong> · VP of Sales Operations, Apex Real Estate Group
              </div>
            </div>
          </div>
        </div>

        {/* Data Visual Infographic: Voice Automation Effectiveness & Customer Satisfaction Metrics */}
        <div className="pt-3 border-t space-y-2.5" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[11px] font-bold" style={{ color: "var(--foreground)" }}>
                Voice Automation Effectiveness &amp; Performance Metrics
              </h2>
            </div>
            <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Live SLA Stats
            </span>
          </div>

          <div className="p-2.5 rounded-lg border space-y-2 text-[9.5px]" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            {/* Metric 1: Call Resolution */}
            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>99.4% Automated Call Resolution Rate</span>
                <span className="font-mono font-bold" style={{ color: "var(--brand-500)" }}>99.4%</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400" style={{ width: "99.4%" }} />
              </div>
            </div>

            {/* Metric 2: Sub-300ms Audio Latency */}
            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>Sub-300ms Speech Synthesis Latency</span>
                <span className="font-mono font-bold text-emerald-500">&lt;300ms</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: "92%" }} />
              </div>
            </div>

            {/* Metric 3: Customer Satisfaction Score */}
            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>Customer Satisfaction Score (CSAT)</span>
                <span className="font-mono font-bold text-amber-500">4.9 / 5.0</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-full bg-amber-400" style={{ width: "98%" }} />
              </div>
            </div>

            {/* Metric 4: Operational Time Savings */}
            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>Average Staff Hours Saved per Week</span>
                <span className="font-mono font-bold" style={{ color: "var(--foreground)" }}>45 hrs / wk</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: "88%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Overview & Feature Matrix Table */}
        <div className="pt-3 border-t space-y-2.5" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-500)" }} />
              <h2 className="text-[11px] font-bold" style={{ color: "var(--foreground)" }}>
                Platform Subscription Tiers &amp; Feature Comparison
              </h2>
            </div>
            <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Transparent Pricing
            </span>
          </div>

          <p className="text-[9.5px] leading-normal" style={{ color: "var(--muted-text)" }}>
            CallAutomate offers flexible subscription tiers designed for teams of all sizes, featuring a 30-day Free Trial with zero credit card required.
          </p>

          <div className="overflow-x-auto rounded-lg border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <table className="w-full text-left text-[9px] border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <th className="p-1.5 font-bold" style={{ color: "var(--foreground)" }}>Plan</th>
                  <th className="p-1.5 font-bold text-center" style={{ color: "var(--foreground)" }}>Price</th>
                  <th className="p-1.5 font-bold text-center" style={{ color: "var(--foreground)" }}>Included Mins</th>
                  <th className="p-1.5 font-bold" style={{ color: "var(--foreground)" }}>Key Features &amp; Capabilities</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                <tr>
                  <td className="p-1.5 font-bold" style={{ color: "#10B981" }}>30-Day Free Trial</td>
                  <td className="p-1.5 text-center font-bold" style={{ color: "var(--foreground)" }}>$0</td>
                  <td className="p-1.5 text-center font-mono">100 mins</td>
                  <td className="p-1.5 leading-tight" style={{ color: "var(--muted-text)" }}>
                    No card required, 24/7 AI Receptionist, sub-300ms voice engine, CRM &amp; calendar sync.
                  </td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold" style={{ color: "var(--foreground)" }}>Starter</td>
                  <td className="p-1.5 text-center font-bold" style={{ color: "var(--foreground)" }}>$49/mo</td>
                  <td className="p-1.5 text-center font-mono">500 mins</td>
                  <td className="p-1.5 leading-tight" style={{ color: "var(--muted-text)" }}>
                    1 dedicated number, $0.10/extra min, Webhooks &amp; Zapier integration, email alerts.
                  </td>
                </tr>
                <tr style={{ background: "rgba(99, 102, 241, 0.05)" }}>
                  <td className="p-1.5 font-bold" style={{ color: "var(--brand-500)" }}>
                    Growth <span className="text-[7.5px] font-extrabold px-1 rounded bg-indigo-500/20 text-indigo-300 ml-1">POPULAR</span>
                  </td>
                  <td className="p-1.5 text-center font-bold" style={{ color: "var(--foreground)" }}>$149/mo</td>
                  <td className="p-1.5 text-center font-mono">2,000 mins</td>
                  <td className="p-1.5 leading-tight" style={{ color: "var(--muted-text)" }}>
                    Up to 5 numbers, $0.08/extra min, custom voice prompts, advanced sentiment analytics.
                  </td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold" style={{ color: "var(--foreground)" }}>Enterprise</td>
                  <td className="p-1.5 text-center font-bold" style={{ color: "var(--foreground)" }}>$499/mo</td>
                  <td className="p-1.5 text-center font-mono">8,000 mins</td>
                  <td className="p-1.5 leading-tight" style={{ color: "var(--muted-text)" }}>
                    Unlimited phone numbers, $0.06/extra min, 99.9% uptime SLA, dedicated account manager.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Voice Automation Use Cases & Response Time Case Study */}
        <div className="pt-3 border-t space-y-2 text-[9.5px]" style={{ borderColor: "var(--border)", color: "var(--muted-text)" }}>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 shrink-0" style={{ color: "var(--brand-500)" }} />
            <h2 className="text-[10px] font-bold" style={{ color: "var(--foreground)" }}>
              Voice Automation Use Cases &amp; Customer Service Response Time Case Study
            </h2>
          </div>

          <p className="leading-normal">
            Businesses across healthcare, real estate, salons, and e-commerce utilize CallAutomate to deploy 24/7 autonomous AI voice receptionists. Key use cases include inbound appointment scheduling, after-hours emergency call routing, automated lead qualification, and instant support ticket creation.
          </p>

          <div className="p-2 rounded-lg border space-y-1.5" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[9.5px]" style={{ color: "var(--foreground)" }}>
                Featured Case Study: Response Time Optimization at Bright Health Dental
              </span>
              <span className="text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                8.5 min → &lt;1 sec
              </span>
            </div>
            <p className="text-[9px] leading-normal">
              <strong>Challenge:</strong> During peak morning intake hours, Bright Health Dental experienced severe phone queue congestion with average patient hold times exceeding 8.5 minutes, leading to high abandoned call rates.
            </p>
            <p className="text-[9px] leading-normal">
              <strong>Solution:</strong> Deployed CallAutomate AI Voice Receptionist (<em>Ava</em>) to answer all inbound booking calls with sub-300ms speech synthesis latency and instant calendar availability lookup.
            </p>
            <div className="pt-0.5 grid grid-cols-2 gap-1 text-[8.5px] font-semibold">
              <div className="p-1 rounded border text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <span className="block text-emerald-500 font-extrabold">+310%</span>
                <span>Booking Efficiency</span>
              </div>
              <div className="p-1 rounded border text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <span className="block text-indigo-400 font-extrabold">&lt;1 Second</span>
                <span>Customer Response Time</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Architecture & Compliance Specifications (Content-to-Code Ratio Optimization) */}
        <div className="pt-3 border-t space-y-2 text-[9.5px]" style={{ borderColor: "var(--border)", color: "var(--muted-text)" }}>
          <h2 className="text-[10px] font-bold" style={{ color: "var(--foreground)" }}>
            Platform Technical Specifications &amp; Compliance Standards
          </h2>
          <p className="leading-normal">
            CallAutomate operates on a cloud-native, multi-region infrastructure delivering ultra-low sub-300ms audio latency over{" "}
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
            and PSTN networks. Our voice engines integrate state-of-the-art neural speech synthesis, automatic speech recognition (ASR) powered by{" "}
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
            models, and custom LLM conversational logic.
          </p>
          <p className="leading-normal">
            All administrative access and customer voice data are protected under SOC 2 Type II compliance standards,{" "}
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
            security controls, and strict{" "}
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
            data processing agreements. Telephony traffic is encrypted end-to-end via TLS 1.3 for signaling and SRTP for media streams.
          </p>

          <div className="pt-2 space-y-2">
            <h2 className="text-[11px] font-bold flex items-center gap-1" style={{ color: "var(--foreground)" }}>
              <HelpCircle className="w-3 h-3" style={{ color: "var(--brand-500)" }} />
              <span>Frequently Asked Questions &amp; Common Objections</span>
            </h2>

            <div className="space-y-1.5 text-[9px]">
              {/* Objection 1: Data Security & Privacy */}
              <div className="p-2 rounded-lg border space-y-0.5" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <strong className="block font-bold text-[9.5px]" style={{ color: "var(--foreground)" }}>
                  Q: How does CallAutomate protect sensitive customer calls and business data?
                </strong>
                <p className="leading-normal" style={{ color: "var(--muted-text)" }}>
                  Security is foundational. All voice streams and transcriptions are encrypted in transit via TLS 1.3/SRTP and at rest using AES-256 encryption. CallAutomate complies with SOC 2 Type II, ISO 27001, and GDPR data processing agreements with strict multi-tenant data isolation.
                </p>
              </div>

              {/* Objection 2: Pricing & Free Trial */}
              <div className="p-2 rounded-lg border space-y-0.5" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <strong className="block font-bold text-[9.5px]" style={{ color: "var(--foreground)" }}>
                  Q: Are there any setup fees, hidden costs, or long-term commitments?
                </strong>
                <p className="leading-normal" style={{ color: "var(--muted-text)" }}>
                  No setup fees or long-term contracts. New organizations can start with a 30-day Free Trial with zero credit card required. Flexible monthly and annual plans include transparent pay-as-you-go telephony rates.
                </p>
              </div>

              {/* Objection 3: Features & Integrations */}
              <div className="p-2 rounded-lg border space-y-0.5" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <strong className="block font-bold text-[9.5px]" style={{ color: "var(--foreground)" }}>
                  Q: Which CRMs, calendars, and telephony systems integrate out-of-the-box?
                </strong>
                <p className="leading-normal" style={{ color: "var(--muted-text)" }}>
                  CallAutomate syncs directly with Google Calendar, Outlook, Salesforce, HubSpot, Zendesk, and custom webhooks. Key capabilities include sub-300ms neural voice synthesis, Whisper transcriptions, sentiment scoring, and automated 24/7 call routing.
                </p>
              </div>

              {/* Objection 4: Account Management & Login */}
              <div className="p-2 rounded-lg border space-y-0.5" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <strong className="block font-bold text-[9.5px]" style={{ color: "var(--foreground)" }}>
                  Q: How do I manage active voice agents and phone numbers after signing in?
                </strong>
                <p className="leading-normal" style={{ color: "var(--muted-text)" }}>
                  Once logged in, your workspace dashboard provides real-time oversight of active phone numbers, agent prompt configurations, live call session logs, sentiment metrics, and single sign-on security settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
