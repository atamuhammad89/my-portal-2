"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Bot, MoreVertical, Edit3, Copy, Trash2, UserCheck, Loader2, RefreshCw } from "lucide-react";

export interface RetellAgentRow {
  id: string;
  agent_id: string;
  agent_name: string;
  voice_id: string;
  voice_name?: string;
  language?: string;
  begin_message?: string;
  general_prompt?: string;
  phone_number?: string | null;
  response_engine?: { type?: string; model?: string; llm_id?: string; llm_websocket_url?: string };
  created_at?: number | string;
  last_modification_timestamp?: number | string;
  userId?: string | null;
  userEmail?: string;
  userName?: string;
}

interface AgentsTableProps {
  agents: RetellAgentRow[];
  loading?: boolean;
  isAdmin?: boolean;
  onRefresh?: () => void;
  onDuplicate?: (agent: RetellAgentRow) => void;
  onDelete?: (agentId: string) => void;
  onReassign?: (agent: RetellAgentRow) => void;
}

function formatRetellDate(timestamp?: number | string): string {
  if (!timestamp) return "—";
  const date = new Date(typeof timestamp === "string" && !isNaN(Number(timestamp)) ? Number(timestamp) : timestamp);
  if (isNaN(date.getTime())) return "—";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}/${yyyy} · ${hh}:${min}`;
}

function formatVoiceInfo(voiceId?: string) {
  if (!voiceId) return { name: "Default Voice", initial: "V", bg: "bg-indigo-600 text-white" };
  const raw = voiceId.replace(/^retell-/, "").replace(/_/g, " ");
  const cleanName = raw.charAt(0).toUpperCase() + raw.slice(1);
  const initial = cleanName.charAt(0).toUpperCase();

  const isFemale = ["ashley", "elena", "sarah", "willa", "emily", "chloe", "cimo"].some((n) =>
    cleanName.toLowerCase().includes(n)
  );

  const bg = isFemale
    ? "bg-gradient-to-tr from-pink-500 to-purple-600 text-white"
    : "bg-gradient-to-tr from-blue-600 to-cyan-500 text-white";

  return { name: cleanName, initial, bg };
}

export function AgentsTable({
  agents,
  loading = false,
  isAdmin = false,
  onRefresh,
  onDuplicate,
  onDelete,
  onReassign,
}: AgentsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuAgentId, setOpenMenuAgentId] = useState<string | null>(null);

  const filteredAgents = useMemo(() => {
    return agents.filter((a) => {
      const q = searchQuery.toLowerCase();
      const nameMatch = (a.agent_name || "").toLowerCase().includes(q);
      const idMatch = (a.agent_id || "").toLowerCase().includes(q);
      const voiceMatch = (a.voice_id || "").toLowerCase().includes(q);
      const phoneMatch = (a.phone_number || "").toLowerCase().includes(q);
      const ownerMatch = (a.userEmail || "").toLowerCase().includes(q) || (a.userName || "").toLowerCase().includes(q);
      return nameMatch || idMatch || voiceMatch || phoneMatch || ownerMatch;
    });
  }, [agents, searchQuery]);

  const handleRowClick = (agentId: string) => {
    router.push(`/agents/${agentId}`);
  };

  return (
    <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden font-sans text-[var(--foreground)] transition-colors duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2">
          <span>All Agents</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--muted-text)] font-semibold border border-[var(--border)]">
            {filteredAgents.length}
          </span>
        </h2>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--subtle-text)]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--subtle-text)] outline-none focus:border-[var(--brand-500)] transition-all"
            />
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer border border-[var(--border)]"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}

          {/* Create an Agent Button */}
          <button
            onClick={() => router.push("/agents/new")}
            className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shrink-0 hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span>Create an Agent</span>
          </button>
        </div>
      </div>

      {/* Agents Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--subtle-text)] font-semibold uppercase text-[11px] tracking-wider">
              <th className="py-3.5 px-5">Agent Name</th>
              <th className="py-3.5 px-5">Agent Type</th>
              <th className="py-3.5 px-5">Voice</th>
              <th className="py-3.5 px-5">Phone</th>
              {isAdmin && <th className="py-3.5 px-5">Owner User</th>}
              <th className="py-3.5 px-5">Edited by</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]">
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-[var(--muted-text)]">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)] mx-auto mb-2" />
                  <span>Loading voice agents...</span>
                </td>
              </tr>
            ) : filteredAgents.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-[var(--muted-text)]">
                  No voice agents found matching your search.
                </td>
              </tr>
            ) : (
              filteredAgents.map((agent) => {
                const voice = formatVoiceInfo(agent.voice_id);
                const isMenuOpen = openMenuAgentId === agent.agent_id;
                const agentTypeLabel =
                  agent.response_engine?.type === "conversation-flow"
                    ? "Conversation Flow"
                    : "Single Prompt";

                return (
                  <tr
                    key={agent.agent_id || agent.id}
                    onClick={() => handleRowClick(agent.agent_id || agent.id)}
                    className="hover:bg-[var(--surface-2)] transition-colors duration-150 cursor-pointer group"
                  >
                    {/* Agent Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="font-semibold text-[var(--foreground)] group-hover:text-[var(--brand-500)] transition-colors">
                          {agent.agent_name}
                        </div>
                      </div>
                    </td>

                    {/* Agent Type */}
                    <td className="py-4 px-5">
                      <span className="inline-block px-3 py-1 rounded-full bg-[var(--surface-2)] text-[var(--muted-text)] border border-[var(--border)] text-[11px] font-medium">
                        {agentTypeLabel}
                      </span>
                    </td>

                    {/* Voice */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full ${voice.bg} text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm`}
                        >
                          {voice.initial}
                        </div>
                        <span className="font-medium text-[var(--foreground)]">{voice.name}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-5">
                      {agent.phone_number ? (
                        <span className="inline-block px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground)] font-mono text-[11px]">
                          {agent.phone_number}
                        </span>
                      ) : (
                        <span className="text-[var(--subtle-text)] font-mono text-[11px]">—</span>
                      )}
                    </td>

                    {/* Owner User (Admin view) */}
                    {isAdmin && (
                      <td className="py-4 px-5">
                        <div className="text-xs">
                          <div className="font-medium text-[var(--foreground)]">
                            {agent.userId ? agent.userName || agent.userEmail : <span className="text-emerald-600 dark:text-emerald-400">🔓 Unassigned</span>}
                          </div>
                          {agent.userId && <div className="text-[10px] text-[var(--subtle-text)]">{agent.userEmail}</div>}
                        </div>
                      </td>
                    )}

                    {/* Edited by / Date */}
                    <td className="py-4 px-5 text-[var(--muted-text)] font-mono text-[11px]">
                      {formatRetellDate(agent.last_modification_timestamp || agent.created_at)}
                    </td>

                    {/* Actions Menu */}
                    <td
                      className="py-4 px-5 text-right relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setOpenMenuAgentId(isMenuOpen ? null : agent.agent_id)}
                        className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-5 top-12 z-30 w-44 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl py-1 text-left text-xs">
                          <button
                            onClick={() => {
                              setOpenMenuAgentId(null);
                              router.push(`/agents/${agent.agent_id || agent.id}`);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-[var(--surface-2)] text-[var(--foreground)] flex items-center gap-2 cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Edit Agent</span>
                          </button>

                          {isAdmin && onReassign && (
                            <button
                              onClick={() => {
                                setOpenMenuAgentId(null);
                                onReassign(agent);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-[var(--surface-2)] text-[var(--foreground)] flex items-center gap-2 cursor-pointer"
                            >
                              <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Reassign Owner</span>
                            </button>
                          )}

                          {onDuplicate && (
                            <button
                              onClick={() => {
                                setOpenMenuAgentId(null);
                                onDuplicate(agent);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-[var(--surface-2)] text-[var(--foreground)] flex items-center gap-2 cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5 text-[var(--muted-text)]" />
                              <span>Duplicate Agent</span>
                            </button>
                          )}

                          {onDelete && (
                            <button
                              onClick={() => {
                                setOpenMenuAgentId(null);
                                onDelete(agent.agent_id || agent.id);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-[var(--surface-2)] text-red-500 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete Agent</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
