"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ManagedUser } from "@/services/admin/adminUsersService";
import { Search, Bot, UserCheck, X } from "lucide-react";
import { formatDateTime } from "@/utils/format";

// ── Types ─────────────────────────────────────────────────────────────────────
type AssignmentRow = { id: string; user_id: string; assistant_id: string; assigned_at: string };

// ── Fetchers ──────────────────────────────────────────────────────────────────
import { apiClient } from "@/lib/api-client";

// ── Fetchers ──────────────────────────────────────────────────────────────────
async function fetchUsers(): Promise<ManagedUser[]> {
  const res = await apiClient.get("/admin/users");
  const data = res.data;

  return data
    .filter((row: any) =>
      row.role === "member" || row.role === "owner"
    )
    .map((row: any) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      tenantId: row.tenant_id ?? null,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));
}

async function fetchAssistantIds(): Promise<string[]> {
  const res = await apiClient.get<string[]>("/admin/agents/assistant-ids");
  return res.data;
}

async function fetchAssignments(): Promise<AssignmentRow[]> {
  const res = await apiClient.get<AssignmentRow[]>("/admin/agents/user-assignments");
  return res.data;
}

async function assignAssistant(user_id: string, assistant_id: string) {
  await apiClient.post("/admin/agents/user-assignments", { user_id, assistant_id });
}

async function unassignAssistant(user_id: string) {
  await apiClient.delete("/admin/agents/user-assignments", {
    data: { user_id }
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminAgentAccessShell() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>("");

  const { data: users = [], isLoading: usersLoading, error: usersError } =
    useQuery({ queryKey: ["admin", "users"], queryFn: fetchUsers });

  const { data: assistantIds = [], isLoading: idsLoading } =
    useQuery({ queryKey: ["admin", "assistant-ids"], queryFn: fetchAssistantIds });

  const { data: assignments = [] } =
    useQuery({ queryKey: ["admin", "user-assignments"], queryFn: fetchAssignments });

  const assignMutation = useMutation({
    mutationFn: ({ userId, assistantId }: { userId: string; assistantId: string }) =>
      assignAssistant(userId, assistantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "user-assignments"] }),
  });

  const unassignMutation = useMutation({
    mutationFn: (userId: string) => unassignAssistant(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "user-assignments"] }),
  });

  const assignmentMap = Object.fromEntries(
    assignments.map((a) => [a.user_id, a])
  );

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.tenantId ?? "").toLowerCase().includes(q)
    );
  });

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;
  const currentAssignment = selectedUserId ? assignmentMap[selectedUserId] : null;

  const handleAssign = () => {
    if (!selectedUserId || !selectedAssistantId) return;
    assignMutation.mutate({ userId: selectedUserId, assistantId: selectedAssistantId });
  };

  return (
    <AdminPermissionGuard allow={["agents"]}>
      <div className="space-y-6">
        <PageHeader
          title="Agent Access"
          description="Assign assistant IDs from CDR records to users/owners."
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:min-h-[600px]">
          {/* ── Left: User List ── */}
          <div className="w-full lg:w-80 lg:shrink-0 flex flex-col gap-3 rounded-2xl p-4 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users…"
                className="w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 text-white"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
              />
            </div>

            {usersLoading ? (
              <LoadingSkeleton className="h-60 w-full" />
            ) : usersError ? (
              <ErrorState message="Could not load users." />
            ) : filteredUsers.length === 0 ? (
              <EmptyState title="No users found" message="Try a different search." />
            ) : (
              <ul className="space-y-1.5 overflow-y-auto max-h-[540px] pr-1 scrollbar-thin">
                {filteredUsers.map((user) => {
                  const hasAssignment = !!assignmentMap[user.id];
                  const isActive = selectedUserId === user.id;
                  return (
                    <li key={user.id}>
                      <button
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setSelectedAssistantId(assignmentMap[user.id]?.assistant_id ?? "");
                        }}
                        className={`w-full text-left rounded-xl px-4 py-3 text-sm transition-all flex items-center justify-between gap-2 border cursor-pointer relative ${
                          isActive
                            ? "bg-[rgba(0,240,255,0.06)] text-white border-brand-cyan/35"
                            : "hover:bg-[rgba(255,255,255,0.02)] text-slate-300 border-transparent hover:text-white"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-cyan rounded-r" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{user.fullName || user.email}</p>
                          <p className={`text-xs truncate ${isActive ? "text-brand-cyan/80" : "text-slate-500"}`}>
                            {user.email}
                          </p>
                        </div>
                        {hasAssignment && (
                          <span className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                            isActive
                              ? "bg-brand-cyan/20 border-brand-cyan/30 text-brand-cyan"
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          }`}>
                            <UserCheck className="h-2.5 w-2.5" /> Assigned
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ── Right: Assignment Panel ── */}
          <div className="flex-1">
            {!selectedUser ? (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]">
                <div className="text-center space-y-3">
                  <Bot className="h-10 w-10 text-[var(--subtle-text)] mx-auto animate-bounce" />
                  <p className="text-sm text-[var(--muted-text)] font-semibold">Select a user to assign an assistant</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* User header */}
                <div className="rounded-2xl border p-5 relative overflow-hidden transition-all duration-200"
                     style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {selectedUser.fullName || selectedUser.email}
                      </h2>
                      <p className="text-xs text-[var(--subtle-text)] mt-0.5">{selectedUser.email}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/25">
                          {selectedUser.role}
                        </span>
                        <StatusBadge
                          text={selectedUser.isActive ? "Active" : "Inactive"}
                          variant={selectedUser.isActive ? "success" : "neutral"}
                        />
                        {selectedUser.tenantId && (
                          <span className="text-xs font-mono text-slate-400 bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                            Tenant: {selectedUser.tenantId.slice(0, 8)}…
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--subtle-text)] font-medium">
                      Joined {formatDateTime(selectedUser.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Current assignment */}
                {currentAssignment && (
                  <div className="rounded-2xl border p-4 flex items-center justify-between flex-wrap gap-3"
                       style={{ background: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)" }}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                        Currently Assigned
                      </p>
                      <p className="text-sm font-mono font-bold text-white bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1.5 rounded-lg inline-block">
                        {currentAssignment.assistant_id}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        Assigned {formatDateTime(currentAssignment.assigned_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => unassignMutation.mutate(selectedUser.id)}
                      disabled={unassignMutation.isPending}
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                      style={{ background: "rgba(244,63,94,0.1)", borderColor: "rgba(244,63,94,0.2)", color: "#fb7185" }}
                    >
                      <X className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                )}

                {/* Assign new */}
                <div className="rounded-2xl border p-5 space-y-4"
                     style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <h3 className="text-sm font-bold text-white">
                    {currentAssignment ? "Change Assignment" : "Assign Assistant ID"}
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedAssistantId}
                      onChange={(e) => setSelectedAssistantId(e.target.value)}
                      className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 text-white cursor-pointer"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                      disabled={idsLoading}
                    >
                      <option value="" className="bg-[var(--surface)] text-white">
                        {idsLoading ? "Loading assistant IDs…" : "Select an assistant ID…"}
                      </option>
                      {assistantIds.map((id) => (
                        <option key={id} value={id} className="bg-[var(--surface)] text-white font-mono">{id}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={!selectedAssistantId || assignMutation.isPending}
                      className="rounded-xl px-5 py-2 text-sm font-bold text-slate-950 transition-all disabled:opacity-40 cursor-pointer hover:bg-brand-cyan/80 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                      style={{ background: "var(--brand-500)" }}
                    >
                      {assignMutation.isPending ? "Saving…" : currentAssignment ? "Update" : "Assign"}
                    </button>
                  </div>
                  {assistantIds.length === 0 && !idsLoading && (
                    <p className="text-xs text-[var(--subtle-text)]">
                      No assistant IDs found in CDR records yet.
                    </p>
                  )}
                </div>

                {/* All assignments overview */}
                {assignments.length > 0 && (
                  <div className="rounded-2xl border p-5"
                       style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <h3 className="text-sm font-bold text-white mb-3">
                      All Assignments ({assignments.length})
                    </h3>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                      {assignments.map((a) => {
                        const user = users.find((u) => u.id === a.user_id);
                        return (
                          <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg px-3 py-2 text-sm gap-2 border"
                               style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                            <div>
                              <span className="font-semibold text-white">
                                {user?.fullName || user?.email || a.user_id.slice(0, 8)}
                              </span>
                              <span className="mx-2 text-brand-cyan">→</span>
                              <span className="font-mono text-xs text-brand-teal bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)]">{a.assistant_id}</span>
                            </div>
                            <span className="text-xs text-[var(--subtle-text)] font-semibold">{formatDateTime(a.assigned_at)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminPermissionGuard>
  );
}