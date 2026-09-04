"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Bot, Users, UserCheck, Loader2, Search, RefreshCw, UserMinus } from "lucide-react";
import { AgentsTable } from "@/components/agents/AgentsTable";

interface AdminAgentItem {
  id: string;
  agent_id: string;
  agent_name: string;
  voice_id: string;
  language?: string;
  begin_message?: string;
  general_prompt?: string;
  created_at?: number | string;
  userId?: string | null;
  userEmail?: string;
  userName?: string;
}

interface UserOption {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AdminAgentItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  // Reassignment Modal State
  const [reassignTargetAgent, setReassignTargetAgent] = useState<AdminAgentItem | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [reassigning, setReassigning] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token") || localStorage.getItem("voiceos_auth_token")
          : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [agentRes, userRes] = await Promise.allSettled([
        fetch("/api/admin/agents", { headers }),
        fetch("/api/admin/users", { headers }),
      ]);

      let fetchedAgents: AdminAgentItem[] = [];
      if (agentRes.status === "fulfilled" && agentRes.value.ok) {
        const agentData = await agentRes.value.json();
        fetchedAgents = Array.isArray(agentData) ? agentData : [];
      } else if (agentRes.status === "fulfilled") {
        console.warn("[Admin Agents Fetch Non-OK]", agentRes.value.status);
      }

      setAgents(fetchedAgents);

      if (userRes.status === "fulfilled" && userRes.value.ok) {
        const userData = await userRes.value.json();
        setUsers(Array.isArray(userData) ? userData : []);
      }
    } catch (e) {
      console.error("[Admin Agents Fetch Error]", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReassign = async (targetAgent?: AdminAgentItem, userIdToAssign?: string) => {
    const agent = targetAgent || reassignTargetAgent;
    const targetUid = userIdToAssign !== undefined ? userIdToAssign : selectedUserId;

    if (!agent) return;

    setReassigning(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.agent_id || agent.id,
          agentName: agent.agent_name,
          targetUserId: targetUid === "unassigned" ? null : targetUid,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to reassign voice agent");
      }

      setReassignTargetAgent(null);
      setSelectedUserId("");
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setReassigning(false);
    }
  };

  const filteredAgents = agents.filter(
    (a) =>
      (a.agent_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.agent_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.userEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.userName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Voice Agents Management"
        description="View all Retell AI agents deployed on the platform, assign agent ownership, or free/unassign agents from user accounts."
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--subtle-text)]" />
          <input
            type="text"
            placeholder="Search by agent name, ID, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--muted-text)] hover:bg-[var(--surface-2)] cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Retell-styled All Agents Table for Admin */}
      <AgentsTable
        agents={filteredAgents}
        users={users}
        loading={loading}
        isAdmin={true}
        onRefresh={fetchData}
        onReassign={(agent, targetUserId) => {
          if (targetUserId !== undefined) {
            handleReassign(agent, targetUserId);
          } else {
            setReassignTargetAgent(agent);
            setSelectedUserId(agent.userId || "unassigned");
          }
        }}
      />

      {/* REASSIGN / UNASSIGN AGENT MODAL */}
      {reassignTargetAgent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl max-w-md w-full space-y-5">
            <h3 className="text-lg font-bold text-[var(--foreground)]">Assign / Free Voice Agent</h3>
            <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-1 text-sm">
              <div className="text-[var(--subtle-text)] text-xs">Target Agent:</div>
              <div className="font-bold text-base text-[var(--foreground)]">{reassignTargetAgent.agent_name}</div>
              <div className="text-xs text-[var(--muted-text)] font-mono">ID: {reassignTargetAgent.agent_id}</div>
              <div className="text-xs text-[var(--muted-text)]">
                Current Owner: {reassignTargetAgent.userId ? reassignTargetAgent.userEmail : "Unassigned"}
              </div>
            </div>

            <div>
              <label className="form-label">Select Owner Account</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="form-select"
              >
                <option value="unassigned">🔓 Unassigned / Free Agent (No User)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    👤 {u.full_name} ({u.email}) - {u.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setReassignTargetAgent(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted-text)] hover:bg-[var(--surface-2)] text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReassign()}
                disabled={reassigning}
                className="flex-1 py-2.5 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {reassigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}