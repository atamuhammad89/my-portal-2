"use client";

import { useState } from "react";
import {
  Bot, Plus, Trash2, RefreshCw, Users, Mic, Globe,
  ChevronRight, MoreHorizontal, Loader2, AlertCircle
} from "lucide-react";
import { useAdminRetellAgentsQuery, useCreateRetellAgentMutation, useDeleteRetellAgentMutation, useAgentAccessQuery, useGrantAgentAccessMutation, useRevokeAgentAccessMutation } from "@/hooks/admin/use-admin-retell-agents-query";
import { useAdminUsersQuery } from "@/hooks/admin/use-admin-users-query";
import { CreateRetellAgentPayload, RetellAgent } from "@/types/retell";
import { cn } from "@/lib/utils";

// ─── Create Agent Modal ────────────────────────────────────────────────────────
function CreateAgentModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreateRetellAgentPayload>({
    name: "",
    language: "en-US",
    response_engine: "retell-llm",
    voice_id: "",
    begin_message: "",
    general_prompt: "",
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
          <h2 className="text-base font-bold text-[var(--foreground)]">Create New Agent</h2>
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
              placeholder="e.g. Sales Assistant"
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
                <option value="pt-BR">Portuguese (BR)</option>
                <option value="ja-JP">Japanese</option>
                <option value="zh-CN">Chinese (Mandarin)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Response Engine</label>
              <select
                className={inputCls}
                value={form.response_engine}
                onChange={(e) => setForm((p) => ({ ...p, response_engine: e.target.value }))}
              >
                <option value="retell-llm">Retell LLM</option>
                <option value="custom-llm">Custom LLM (WebSocket)</option>
              </select>
            </div>
          </div>

          {form.response_engine === "custom-llm" && (
            <div>
              <label className={labelCls}>LLM WebSocket URL</label>
              <input
                className={inputCls}
                placeholder="wss://your-llm.example.com/ws"
                value={form.llm_websocket_url ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, llm_websocket_url: e.target.value }))}
              />
            </div>
          )}

          <div>
            <label className={labelCls}>Voice ID</label>
            <input
              className={inputCls}
              placeholder="e.g. 11labs-Adrian (from Retell dashboard)"
              value={form.voice_id ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, voice_id: e.target.value }))}
            />
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
            <label className={labelCls}>General Prompt / System Prompt</label>
            <textarea
              className={cn(inputCls, "resize-none")}
              rows={4}
              placeholder="You are a helpful assistant..."
              value={form.general_prompt ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, general_prompt: e.target.value }))}
            />
          </div>

          {regularUsers.length > 0 && (
            <div>
              <label className={labelCls}>Grant Access To Users</label>
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
                      <span className="text-sm text-[var(--foreground)]">{u.fullName}</span>
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
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold bg-[var(--surface-2)] text-[var(--muted-text)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] hover:border-[var(--brand-500)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand-500)] px-4 py-2 text-xs font-bold text-[var(--brand-btn-text)] shadow-[var(--brand-btn-shadow)] hover:shadow-[var(--brand-btn-shadow-hover)] hover:bg-[var(--brand-600)] transition disabled:opacity-60 cursor-pointer"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Creating on Retell…" : "Create Agent"}
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
}: {
  agent: RetellAgent;
  onDelete: (id: string, name: string) => void;
  onManageAccess: (agent: RetellAgent) => void;
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

      <div className="mt-4 flex items-center gap-2 border-t border-[var(--border-light)] pt-4">
        <button
          onClick={() => onManageAccess(agent)}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--muted-text)] transition-all hover:bg-[var(--surface)] hover:text-[var(--foreground)] hover:border-[var(--brand-500)] cursor-pointer"
        >
          <Users className="h-3.5 w-3.5" />
          Manage Access
        </button>
        <button
          onClick={() => onDelete(agent.id, agent.name)}
          className="ml-auto flex items-center gap-1.5 rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-xs font-semibold text-[var(--danger-fg)] transition-all hover:bg-rose-500 hover:text-white hover:border-rose-500 cursor-pointer"
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
            <h2 className="text-base font-bold text-[var(--foreground)]">Manage Access</h2>
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
            <p className="py-8 text-center text-sm text-[var(--muted-text)]">No regular users found.</p>
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
                        "rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 cursor-pointer",
                        hasAccess
                          ? "bg-[var(--danger-bg)] text-[var(--danger-fg)] hover:bg-[var(--danger-hover-bg)]"
                          : "bg-[var(--brand-500)] text-[var(--brand-btn-text)] hover:bg-[var(--brand-600)]"
                      )}
                    >
                      {hasAccess ? "Revoke" : "Grant"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t border-[var(--border)] px-6 py-4 bg-[var(--surface-2)]">
          <button onClick={onClose} className="w-full rounded-xl bg-[var(--surface)] border border-[var(--border)] py-2 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--brand-500)] transition cursor-pointer">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Shell ────────────────────────────────────────────────────────────────
export function AdminRetellAgentsShell() {
  const [showCreate, setShowCreate] = useState(false);
  const [accessAgent, setAccessAgent] = useState<RetellAgent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: agents = [], isLoading, error, refetch, isRefetching } = useAdminRetellAgentsQuery();
  const { mutate: deleteAgent, isPending: isDeleting } = useDeleteRetellAgentMutation();

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteAgent(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] font-display">AI Voice Agents</h1>
          <p className="mt-1 text-sm text-[var(--muted-text)]">
            Create and manage Retell AI agents. Changes sync to Retell in real time.
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
            className="flex items-center gap-2 rounded-xl bg-[var(--brand-500)] px-4 py-2 text-xs font-bold text-[var(--brand-btn-text)] shadow-[var(--brand-btn-shadow)] hover:shadow-[var(--brand-btn-shadow-hover)] hover:bg-[var(--brand-600)] transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Agent
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="h-8 w-8 text-[var(--danger-fg)]" />
          <p className="text-sm text-[var(--danger-fg)]">{(error as Error).message}</p>
          <button onClick={() => refetch()} className="text-sm underline text-[var(--muted-text)] cursor-pointer">Retry</button>
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[var(--border)] py-20 text-center bg-[var(--surface-2)]/30">
          <Bot className="h-10 w-10 text-[var(--subtle-text)]" />
          <div>
            <p className="font-bold text-[var(--foreground)]">No agents yet</p>
            <p className="mt-1 text-sm text-[var(--muted-text)]">Create your first Retell AI agent to get started.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--brand-500)] px-4 py-2 text-xs font-bold text-[var(--brand-btn-text)] shadow-[var(--brand-btn-shadow)] hover:shadow-[var(--brand-btn-shadow-hover)] hover:bg-[var(--brand-600)] transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Agent
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onDelete={(id, name) => setDeleteTarget({ id, name })}
              onManageAccess={setAccessAgent}
            />
          ))}
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
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold bg-[var(--surface-2)] text-[var(--muted-text)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] hover:border-[var(--brand-500)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-xl bg-[var(--danger-fg)] px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-60 cursor-pointer"
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