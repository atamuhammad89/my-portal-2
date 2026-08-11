"use client";

import { useState, useEffect } from "react";
import {
  Bot, Plus, Trash2, RefreshCw, Users, Mic, Globe,
  ChevronRight, MoreHorizontal, Loader2, AlertCircle, PhoneCall,
  Database, Tag, Activity, Send, Play, CheckCircle2, X, Sparkles, UserMinus, UserCheck, Shield
} from "lucide-react";
import { useAdminRetellAgentsQuery, useCreateRetellAgentMutation, useDeleteRetellAgentMutation, useAgentAccessQuery, useGrantAgentAccessMutation, useRevokeAgentAccessMutation } from "@/hooks/admin/use-admin-retell-agents-query";
import { useAdminUsersQuery } from "@/hooks/admin/use-admin-users-query";
import { CreateRetellAgentPayload, RetellAgent, RetellPhoneNumberResponse, RetellKnowledgeBaseResponse, RetellTestDefinitionResponse, RetellConcurrencyStatusResponse } from "@/types/retell";
import { cn } from "@/lib/utils";

// ─── Create Agent Modal ────────────────────────────────────────────────────────
function CreateAgentModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreateRetellAgentPayload>({
    name: "",
    language: "en-US",
    response_engine: "retell-llm",
    voice_id: "retell-Cimo",
    begin_message: "Hello! Thank you for calling.",
    general_prompt: "You are a professional AI voice assistant.",
    assign_user_ids: [],
  });

  const { data: users = [] } = useAdminUsersQuery();
  const { mutate: createAgent, isPending, error } = useCreateRetellAgentMutation();

  const regularUsers = users.filter((u) =>
    !["super_admin", "operations", "support", "finance"].includes(u.role)
  );

  function toggle(userId: string) {
    setForm((prev) => {
      const ids = prev.assign_user_ids ?? [];
      return {
        ...prev,
        assign_user_ids: ids.includes(userId)
          ? ids.filter((id) => id !== userId)
          : [...ids, userId],
      };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    createAgent(form, { onSuccess: onClose });
  }

  const inputCls = "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30 placeholder-[var(--subtle-text)] transition";
  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--subtle-text)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-[var(--surface-2)]">
          <h2 className="text-base font-bold text-[var(--foreground)]">Create New Platform Voice Agent</h2>
          <button onClick={onClose} className="text-[var(--muted-text)] hover:text-[var(--foreground)] text-xl leading-none cursor-pointer">×</button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{(error as Error).message}</span>
            </div>
          )}

          <div>
            <label className={labelCls}>Agent Name <span className="text-red-500">*</span></label>
            <input
              className={inputCls}
              placeholder="e.g. Platform Support Assistant"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Language</label>
              <select
                className={inputCls}
                value={form.language}
                onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Voice Engine</label>
              <select
                className={inputCls}
                value={form.voice_id}
                onChange={(e) => setForm((p) => ({ ...p, voice_id: e.target.value }))}
              >
                <option value="retell-Cimo">retell-Cimo (Friendly Male)</option>
                <option value="retell-Sarah">retell-Sarah (Professional Female)</option>
                <option value="retell-James">retell-James (UK Male)</option>
                <option value="retell-Elena">retell-Elena (Warm Female)</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Begin Message</label>
            <textarea
              className={cn(inputCls, "resize-none")}
              rows={2}
              placeholder="Hello! How can I help you today?"
              value={form.begin_message ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, begin_message: e.target.value }))}
            />
          </div>

          <div>
            <label className={labelCls}>General Prompt / System Instructions</label>
            <textarea
              className={cn(inputCls, "resize-none")}
              rows={4}
              placeholder="You are an AI phone assistant..."
              value={form.general_prompt ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, general_prompt: e.target.value }))}
            />
          </div>

          {regularUsers.length > 0 && (
            <div>
              <label className={labelCls}>Assign Initial Owner Users</label>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-[var(--border)] divide-y divide-[var(--border-light)] bg-[var(--surface-2)]">
                {regularUsers.map((u) => {
                  const checked = (form.assign_user_ids ?? []).includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-[var(--surface)] transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[var(--border)] accent-[var(--brand-500)]"
                        checked={checked}
                        onChange={() => toggle(u.id)}
                      />
                      <span className="text-sm text-[var(--foreground)] font-semibold">{u.fullName}</span>
                      <span className="ml-auto text-xs text-[var(--muted-text)]">{u.email}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-[var(--border-light)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold bg-[var(--surface-2)] text-[var(--muted-text)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand-500)] px-4 py-2 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition disabled:opacity-60 cursor-pointer"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Deploying on Retell…" : "Create & Assign Agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Agent Card ────────────────────────────────────────────────────────────────
function AgentCard({
  agent,
  onDelete,
  onManageAccess,
  onPublish,
}: {
  agent: RetellAgent;
  onDelete: (id: string, name: string) => void;
  onManageAccess: (agent: RetellAgent) => void;
  onPublish: (agent: RetellAgent) => void;
}) {
  return (
    <div
      className="rounded-2xl border p-5 transition-all duration-200 hover:shadow-md hover:border-[var(--brand-500)]/30"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-100)] text-[var(--brand-500)]">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-[var(--foreground)]">{agent.name}</p>
            <p className="text-[10px] text-[var(--subtle-text)] font-mono mt-0.5">{agent.retell_agent_id}</p>
          </div>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold border",
          agent.is_active
            ? "bg-[var(--success-bg)] text-[var(--success-fg)] border-[var(--success-fg)]/20"
            : "bg-[var(--surface-2)] text-[var(--muted-text)] border-[var(--border)]"
        )}>
          {agent.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-[var(--muted-text)]">
          <Globe className="h-3.5 w-3.5 text-[var(--brand-500)]" />
          <span>{agent.language}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--muted-text)]">
          <Mic className="h-3.5 w-3.5 text-[var(--brand-500)]" />
          <span className="truncate">{agent.voice_id ?? "Default voice"}</span>
        </div>
      </div>

      {agent.begin_message && (
        <p className="mt-3 truncate text-xs text-[var(--subtle-text)] italic">
          &ldquo;{agent.begin_message}&rdquo;
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-[var(--border-light)] pt-4 flex-wrap">
        <button
          onClick={() => onManageAccess(agent)}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-text)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] cursor-pointer"
        >
          <Users className="h-3.5 w-3.5" />
          Manage Access
        </button>
        <button
          onClick={() => onPublish(agent)}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--brand-500)] cursor-pointer"
        >
          <Tag className="h-3.5 w-3.5 text-[var(--brand-500)]" />
          Publish
        </button>
        <button
          onClick={() => onDelete(agent.id, agent.name)}
          className="ml-auto flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Access Management Modal ──────────────────────────────────────────────────
function AccessModal({ agent, onClose }: { agent: RetellAgent; onClose: () => void }) {
  const { data: accessList = [], isLoading } = useAgentAccessQuery(agent.id);
  const { data: allUsers = [] } = useAdminUsersQuery();
  const grantMutation = useGrantAgentAccessMutation(agent.id);
  const revokeMutation = useRevokeAgentAccessMutation(agent.id);

  const grantedIds = new Set((accessList as Array<{ user_id: string }>).map((a) => a.user_id));
  const regularUsers = allUsers.filter((u) =>
    !["super_admin", "operations", "support", "finance"].includes(u.role)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-[var(--surface-2)]">
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">Manage User Access & Ownership</h2>
            <p className="text-xs text-[var(--muted-text)] mt-0.5">{agent.name}</p>
          </div>
          <button onClick={onClose} className="text-[var(--muted-text)] hover:text-[var(--foreground)] text-xl leading-none cursor-pointer">×</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 bg-[var(--surface)]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-500)]" />
            </div>
          ) : regularUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-text)]">No user accounts found.</p>
          ) : (
            <div className="space-y-2">
              {regularUsers.map((u) => {
                const hasAccess = grantedIds.has(u.id);
                const busy = grantMutation.isPending || revokeMutation.isPending;
                return (
                  <div key={u.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 bg-[var(--surface-2)]">
                    <div>
                      <p className="text-sm font-bold text-[var(--foreground)]">{u.fullName}</p>
                      <p className="text-xs text-[var(--muted-text)]">{u.email} · {u.role}</p>
                    </div>
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (hasAccess) revokeMutation.mutate([u.id]);
                        else grantMutation.mutate([u.id]);
                      }}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 cursor-pointer flex items-center gap-1",
                        hasAccess
                          ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                          : "bg-[var(--brand-500)] text-[var(--brand-btn-text)] hover:opacity-90"
                      )}
                    >
                      {hasAccess ? (
                        <>
                          <UserMinus className="h-3 w-3" /> Revoke
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3 w-3" /> Grant
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t border-[var(--border)] px-6 py-4 bg-[var(--surface-2)]">
          <button onClick={onClose} className="w-full rounded-xl bg-[var(--surface)] border border-[var(--border)] py-2 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-2)] transition cursor-pointer">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Control Center Shell ─────────────────────────────────────────
export function AdminRetellAgentsShell() {
  const [adminTab, setAdminTab] = useState<"agents" | "numbers" | "kb" | "tests" | "analytics">("agents");

  const [showCreate, setShowCreate] = useState(false);
  const [accessAgent, setAccessAgent] = useState<RetellAgent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: agents = [], isLoading, error, refetch, isRefetching } = useAdminRetellAgentsQuery();
  const { mutate: deleteAgent, isPending: isDeleting } = useDeleteRetellAgentMutation();

  // Admin Tab Data States
  const [phoneNumbers, setPhoneNumbers] = useState<RetellPhoneNumberResponse[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<RetellKnowledgeBaseResponse[]>([]);
  const [tests, setTests] = useState<RetellTestDefinitionResponse[]>([]);
  const [concurrency, setConcurrency] = useState<RetellConcurrencyStatusResponse | null>(null);

  useEffect(() => {
    if (adminTab === "numbers") {
      fetch("/api/admin/phone-numbers").then((r) => r.json()).then((d) => setPhoneNumbers(Array.isArray(d) ? d : []));
    }
    if (adminTab === "kb") {
      fetch("/api/admin/knowledge-base").then((r) => r.json()).then((d) => setKnowledgeBases(Array.isArray(d) ? d : []));
    }
    if (adminTab === "tests") {
      fetch("/api/admin/tests").then((r) => r.json()).then((d) => setTests(Array.isArray(d) ? d : []));
    }
    if (adminTab === "analytics") {
      fetch("/api/admin/analytics/concurrency").then((r) => r.json()).then((d) => setConcurrency(d));
    }
  }, [adminTab]);

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteAgent(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  }

  const handlePublish = async (agent: RetellAgent) => {
    try {
      const res = await fetch(`/api/admin/agents/${agent.retell_agent_id || agent.id}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Publish failed");
      const data = await res.json();
      alert(`Published agent "${agent.name}"! Version: ${data.version}`);
      refetch();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] font-display flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--brand-500)]" />
            Admin Voice AI Control Center
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-text)]">
            Platform-wide Voice AI management, tenant ownership assignment, Knowledge Base hub, automated testing, and concurrency metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-xl border border-[var(--border)] p-2 text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:opacity-50 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--brand-500)] px-4 py-2 text-xs font-bold text-[var(--brand-btn-text)] shadow-md hover:opacity-90 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Platform Agent
          </button>
        </div>
      </div>

      {/* Admin Module Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto">
        <button
          onClick={() => setAdminTab("agents")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            adminTab === "agents"
              ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)]"
              : "bg-[var(--surface-2)] text-[var(--muted-text)] hover:text-[var(--foreground)]"
          }`}
        >
          <Bot className="h-3.5 w-3.5" />
          All Agents ({agents.length})
        </button>

        <button
          onClick={() => setAdminTab("numbers")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            adminTab === "numbers"
              ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)]"
              : "bg-[var(--surface-2)] text-[var(--muted-text)] hover:text-[var(--foreground)]"
          }`}
        >
          <PhoneCall className="h-3.5 w-3.5" />
          Platform Phone Numbers
        </button>

        <button
          onClick={() => setAdminTab("kb")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            adminTab === "kb"
              ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)]"
              : "bg-[var(--surface-2)] text-[var(--muted-text)] hover:text-[var(--foreground)]"
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          Knowledge Base Hub
        </button>

        <button
          onClick={() => setAdminTab("tests")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            adminTab === "tests"
              ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)]"
              : "bg-[var(--surface-2)] text-[var(--muted-text)] hover:text-[var(--foreground)]"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Testing Suite
        </button>

        <button
          onClick={() => setAdminTab("analytics")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            adminTab === "analytics"
              ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)]"
              : "bg-[var(--surface-2)] text-[var(--muted-text)] hover:text-[var(--foreground)]"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          Concurrency & Analytics
        </button>
      </div>

      {/* ADMIN TAB 1: ALL AGENTS */}
      {adminTab === "agents" && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-red-400">{(error as Error).message}</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[var(--border)] py-20 text-center bg-[var(--surface-2)]/30">
              <Bot className="h-10 w-10 text-[var(--subtle-text)]" />
              <div>
                <p className="font-bold text-[var(--foreground)]">No platform agents found</p>
                <p className="mt-1 text-sm text-[var(--muted-text)]">Create your first agent to populate the platform.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onDelete={(id, name) => setDeleteTarget({ id, name })}
                  onManageAccess={setAccessAgent}
                  onPublish={handlePublish}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ADMIN TAB 2: PHONE NUMBERS */}
      {adminTab === "numbers" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <h3 className="font-bold text-sm text-[var(--foreground)] mb-3">Provisioned Platform DIDs</h3>
            {phoneNumbers.length === 0 ? (
              <p className="text-xs text-[var(--muted-text)]">No phone numbers provisioned yet.</p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {phoneNumbers.map((p) => (
                  <div key={p.phone_number} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold font-mono text-[var(--foreground)]">{p.phone_number}</div>
                      <div className="text-[var(--subtle-text)]">{p.nickname || "DID Line"}</div>
                    </div>
                    <div className="text-[var(--muted-text)] font-mono">
                      Inbound: {p.inbound_agents?.[0]?.agent_id || "Unassigned"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN TAB 3: KNOWLEDGE BASE HUB */}
      {adminTab === "kb" && (
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
          <h3 className="font-bold text-sm text-[var(--foreground)]">Global Knowledge Bases</h3>
          {knowledgeBases.length === 0 ? (
            <p className="text-xs text-[var(--muted-text)]">No Knowledge Bases created yet.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {knowledgeBases.map((kb) => (
                <div key={kb.knowledge_base_id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[var(--foreground)]">{kb.knowledge_base_name}</div>
                    <div className="text-[11px] font-mono text-[var(--subtle-text)]">{kb.knowledge_base_id}</div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 font-semibold uppercase">
                    {kb.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADMIN TAB 4: TESTING SUITE */}
      {adminTab === "tests" && (
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
          <h3 className="font-bold text-sm text-[var(--foreground)]">Automated Test Definitions</h3>
          {tests.length === 0 ? (
            <p className="text-xs text-[var(--muted-text)]">No automated tests configured.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {tests.map((t) => (
                <div key={t.test_id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[var(--foreground)]">{t.name}</div>
                    <div className="text-[11px] font-mono text-[var(--subtle-text)]">Target Agent: {t.agent_id}</div>
                  </div>
                  <span className="text-xs text-[var(--brand-500)] font-semibold">
                    {t.evaluators?.length || 0} Evaluators
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADMIN TAB 5: CONCURRENCY & ANALYTICS */}
      {adminTab === "analytics" && (
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <h3 className="font-bold text-base text-[var(--foreground)] flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--brand-500)]" />
            Real-Time Retell AI Concurrency Gauge
          </h3>
          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] max-w-sm space-y-2">
            <div className="flex justify-between text-sm font-bold text-[var(--foreground)]">
              <span>Active Concurrent Calls:</span>
              <span className="text-[var(--brand-500)]">{concurrency?.current_concurrency ?? 2}</span>
            </div>
            <div className="flex justify-between text-xs text-[var(--subtle-text)]">
              <span>Account Limit:</span>
              <span>{concurrency?.concurrency_limit ?? 20} calls</span>
            </div>
            <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-[var(--brand-500)] h-full transition-all"
                style={{
                  width: `${Math.min(100, (((concurrency?.current_concurrency ?? 2) / (concurrency?.concurrency_limit ?? 20)) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreate && <CreateAgentModal onClose={() => setShowCreate(false)} />}
      {accessAgent && <AccessModal agent={accessAgent} onClose={() => setAccessAgent(null)} />}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-xl">
            <h3 className="font-bold text-[var(--foreground)] text-base">Delete Agent</h3>
            <p className="mt-2 text-sm text-[var(--muted-text)]">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This will also
              remove it from Retell and cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold bg-[var(--surface-2)] text-[var(--muted-text)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-xl bg-red-500 text-xs font-bold text-white hover:bg-red-600 transition disabled:opacity-60 cursor-pointer"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}