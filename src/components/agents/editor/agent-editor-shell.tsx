"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Bot, Sparkles, Mic, Database, Cpu, PhoneCall, Play, Activity, Tag, Check, Loader2, Save, Trash2, Globe
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import {
  OverviewGroup, IntelligenceGroup, CommunicationGroup, TestingGroup, AnalyticsGroup, PublishingGroup
} from "./agent-workspace-groups";

interface AgentEditorShellProps {
  agent: any;
}

export function AgentEditorShell({ agent: initialAgent }: AgentEditorShellProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const handleBackToAgents = () => {
    const roleStr = (user?.role || "").toLowerCase();
    const isAdmin = ["super_admin", "admin", "operations", "support", "finance"].includes(roleStr);
    if (isAdmin) {
      router.push("/admin/agents");
    } else {
      router.push("/agents");
    }
  };

  const [agent, setAgent] = useState(initialAgent);
  const [activeGroup, setActiveGroup] = useState<"overview" | "intelligence" | "communication" | "testing" | "analytics" | "publishing">("overview");
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [sectionStatus, setSectionStatus] = useState<Record<string, "saved" | "saving" | "error">>({});

  const handleSaveSection = async (section: string, payload: any) => {
    setSavingSection(section);
    setSectionStatus((prev) => ({ ...prev, [section]: "saving" }));

    // Optimistically update local agent state
    setAgent((prev: any) => ({
      ...prev,
      ...payload,
      ...(payload.name ? { agent_name: payload.name, name: payload.name } : {}),
    }));

    try {
      const res = await fetch(`/api/agents/${agent.agent_id || agent.id}/${section}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (res.ok) {
        setSectionStatus((prev) => ({ ...prev, [section]: "saved" }));
        const updatedObj = resData.data || resData;
        if (updatedObj && typeof updatedObj === "object") {
          setAgent((prev: any) => ({
            ...prev,
            ...updatedObj,
            name: updatedObj.name || updatedObj.agent_name || prev.name,
            agent_name: updatedObj.agent_name || updatedObj.name || prev.agent_name,
          }));
        }
        setTimeout(() => {
          setSectionStatus((prev) => {
            const next = { ...prev };
            delete next[section];
            return next;
          });
        }, 2500);
      } else {
        setSectionStatus((prev) => ({ ...prev, [section]: "error" }));
      }
    } catch (e) {
      setSectionStatus((prev) => ({ ...prev, [section]: "error" }));
    } finally {
      setSavingSection(null);
    }
  };

  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const handlePublishAgent = async () => {
    setPublishing(true);
    setPublishMessage(null);
    try {
      const res = await fetch(`/api/agents/${agent.agent_id || agent.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: agent.version || 1,
          version_title: `v${agent.version || 1}.0`,
          version_description: "Published from CallAutomate Agent Editor",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const publishedVer = data.version || (agent.version ? agent.version + 1 : 2);
        setPublishMessage(`v${publishedVer} Published!`);
        setAgent((prev: any) => ({
          ...prev,
          version: publishedVer,
          is_active: true,
          status: "published",
        }));
        setTimeout(() => setPublishMessage(null), 4000);
      } else {
        alert(data.error || "Failed to publish agent.");
      }
    } catch (e: any) {
      alert(e.message || "Failed to publish agent.");
    } finally {
      setPublishing(false);
    }
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: Bot, desc: "General, Prompting & Voice Engine" },
    { id: "intelligence", label: "Intelligence", icon: Database, desc: "Knowledge RAG & LLM Models" },
    { id: "communication", label: "Phone Numbers", icon: PhoneCall, desc: "Phone DIDs & Telephony Routing" },
    { id: "testing", label: "Testing Studio", icon: Play, desc: "WebRTC Voice & Chat Simulator" },
    { id: "analytics", label: "Analytics", icon: Activity, desc: "Telemetry & Performance Metrics" },
    { id: "publishing", label: "Publishing", icon: Tag, desc: "Versions & Production Deployment" },
  ] as const;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToAgents}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Agents
          </button>

          <span className="h-4 w-px bg-[var(--border)]" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-[var(--foreground)] text-base">{agent.name || agent.agent_name || "Voice Agent"}</h1>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-[var(--surface-2)] text-[var(--brand-500)] border border-[var(--border)]">
                {agent.provider === "retell" || !agent.provider ? "CallAutomate" : agent.provider}
              </span>
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border",
                agent.version && agent.version > 1 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}>
                {agent.version && agent.version > 1 ? `Published (v${agent.version})` : "Draft"}
              </span>
            </div>
          </div>
        </div>

        {/* Sectional Autosave Status & Global Controls */}
        <div className="flex items-center gap-3">
          {publishMessage && (
            <span className="px-3 py-1 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse flex items-center gap-1">
              <Check className="h-3.5 w-3.5" />
              {publishMessage}
            </span>
          )}

          {Object.entries(sectionStatus).map(([sec, st]) => (
            <span key={sec} className="text-[11px] font-medium flex items-center gap-1 text-[var(--muted-text)] bg-[var(--surface-2)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
              <span className="capitalize">{sec}:</span>
              {st === "saving" && <Loader2 className="h-3 w-3 animate-spin text-[var(--brand-500)]" />}
              {st === "saved" && <Check className="h-3 w-3 text-emerald-400" />}
              <span className="capitalize font-bold">{st}</span>
            </span>
          ))}

          <button
            onClick={handlePublishAgent}
            disabled={publishing}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] px-4 py-2 text-xs font-bold shadow-md hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}
            {publishing ? "Publishing..." : "Publish Agent"}
          </button>

          <button
            onClick={handleBackToAgents}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface)] transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </header>

      {/* Main Workspace Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sub-Sidebar */}
        <aside className="w-full md:w-64 border-r border-[var(--border)] bg-[var(--surface-2)]/40 p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--subtle-text)] px-3 mb-2">Agent Workspace</p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeGroup === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveGroup(item.id)}
                className={cn(
                  "w-full flex items-start gap-3 rounded-xl p-3 text-left transition cursor-pointer",
                  isActive
                    ? "bg-[var(--surface)] border border-[var(--border)] shadow-xs text-[var(--foreground)]"
                    : "text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                )}
              >
                <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", isActive ? "text-[var(--brand-500)]" : "text-[var(--muted-text)]")} />
                <div>
                  <p className="text-xs font-bold leading-none">{item.label}</p>
                  <p className="text-[10px] text-[var(--subtle-text)] mt-1">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Right Workspace Panel */}
        <main className="flex-1 p-6 md:p-8 bg-[var(--background)]">
          {activeGroup === "overview" && <OverviewGroup agent={agent} onSaveSection={handleSaveSection} savingSection={savingSection} />}
          {activeGroup === "intelligence" && <IntelligenceGroup agent={agent} onSaveSection={handleSaveSection} savingSection={savingSection} />}
          {activeGroup === "communication" && <CommunicationGroup agent={agent} onSaveSection={handleSaveSection} savingSection={savingSection} />}
          {activeGroup === "testing" && <TestingGroup agent={agent} onSaveSection={handleSaveSection} savingSection={savingSection} />}
          {activeGroup === "analytics" && <AnalyticsGroup agent={agent} onSaveSection={handleSaveSection} savingSection={savingSection} />}
          {activeGroup === "publishing" && <PublishingGroup agent={agent} onSaveSection={handleSaveSection} savingSection={savingSection} />}
        </main>
      </div>
    </div>
  );
}
