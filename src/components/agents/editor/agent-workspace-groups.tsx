"use client";

import React, { useState, useEffect } from "react";
import {
  Bot, Mic, MicOff, PhoneOff, Volume2, Database, PhoneCall, Cpu, Wrench, CheckCircle2, Play, Activity, Tag, Sparkles, Send, Trash2, Plus, Loader2, Save, Link2, Unlink, RefreshCw, AlertCircle, Check, FileText, Globe, File, Upload, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RetellVoiceLibraryModal } from "./retell-voice-library-modal";
import type { RetellVoice, RetellPhoneNumberResponse, RetellKnowledgeBaseResponse } from "@/types/retell";



interface GroupProps {
  agent: any;
  onSaveSection: (section: string, payload: any) => Promise<void>;
  savingSection: string | null;
}

export function OverviewGroup({ agent, onSaveSection, savingSection }: GroupProps) {
  const [general, setGeneral] = useState({
    name: agent.agent_name || agent.name || agent.config?.general?.name || "",
    provider: agent.provider || agent.config?.general?.provider || "retell",
    description: agent.description || agent.config?.general?.description || "",
    language: agent.language || "en-US",
    timezone: agent.timezone || agent.config?.general?.timezone || "America/New_York",
    fallback_language: agent.fallback_language || "en-US",
  });

  React.useEffect(() => {
    setGeneral({
      name: agent.agent_name || agent.name || agent.config?.general?.name || "",
      provider: agent.provider || agent.config?.general?.provider || "retell",
      description: agent.description || agent.config?.general?.description || "",
      language: agent.language || "en-US",
      timezone: agent.timezone || agent.config?.general?.timezone || "America/New_York",
      fallback_language: agent.fallback_language || "en-US",
    });
  }, [agent.name, agent.agent_name, agent.language, agent.timezone]);

  const [conversation, setConversation] = useState({
    begin_message: agent.begin_message ?? "",
    general_prompt: agent.general_prompt ?? "",
    begin_after_user_silence_ms: agent.begin_after_user_silence_ms ?? 2000,
  });

  React.useEffect(() => {
    setConversation({
      begin_message: agent.begin_message ?? "",
      general_prompt: agent.general_prompt ?? "",
      begin_after_user_silence_ms: agent.begin_after_user_silence_ms ?? 2000,
    });
  }, [agent.begin_message, agent.general_prompt, agent.begin_after_user_silence_ms]);

  const [voice, setVoice] = useState({
    voice_id: agent.voice_id || "retell-Cimo",
    provider: agent.config?.voice?.provider || "retell",
    speed: agent.config?.voice?.speed ?? 1.0,
    pitch: agent.config?.voice?.pitch ?? 1.0,
  });

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(agent.voice_id || "retell-Cimo");

  return (
    <div className="space-y-8 max-w-4xl">
      {/* General Settings Section */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Bot className="h-4 w-4 text-[var(--brand-500)]" />
            General Agent Settings
          </h3>
          <button
            onClick={() => onSaveSection("general", general)}
            disabled={savingSection === "general"}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {savingSection === "general" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {savingSection === "general" ? "Saving..." : "Save General"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">Agent Name</label>
            <input
              type="text"
              value={general.name}
              onChange={(e) => setGeneral((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--foreground)]"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">Primary Language</label>
            <select
              value={general.language}
              onChange={(e) => setGeneral((p) => ({ ...p, language: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--foreground)]"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">Timezone</label>
            <select
              value={general.timezone}
              onChange={(e) => setGeneral((p) => ({ ...p, timezone: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--foreground)]"
            >
              <option value="America/New_York">Eastern Time (US)</option>
              <option value="America/Chicago">Central Time (US)</option>
              <option value="America/Los_Angeles">Pacific Time (US)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Asia/Karachi">Karachi (PKT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conversation & Prompting Section */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--brand-500)]" />
            Conversation Prompting & Behavior
          </h3>
          <button
            onClick={() => onSaveSection("conversation", conversation)}
            disabled={savingSection === "conversation"}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {savingSection === "conversation" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {savingSection === "conversation" ? "Saving..." : "Save Prompt"}
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-[var(--foreground)]">Custom First Message</label>
            </div>
            <p className="text-[11px] text-[var(--subtle-text)] mb-1.5">
              First utterance by the agent. Leave empty (<code className="px-1 py-0.5 bg-[var(--surface-2)] rounded font-mono">""</code>) to make the agent wait for the user to speak first.
            </p>
            <textarea
              rows={2}
              value={conversation.begin_message}
              onChange={(e) => setConversation((p) => ({ ...p, begin_message: e.target.value }))}
              placeholder="Hey! Thanks for calling. How can I help you today?"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--foreground)] resize-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">System Prompt / Instructions</label>
            <textarea
              rows={8}
              value={conversation.general_prompt}
              onChange={(e) => setConversation((p) => ({ ...p, general_prompt: e.target.value }))}
              placeholder="You are a helpful AI voice assistant..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--foreground)] font-mono resize-none"
            />
          </div>

          <div className="pt-1">
            <label className="block font-bold text-[var(--foreground)] mb-1">Pause Before Speaking</label>
            <p className="text-[11px] text-[var(--subtle-text)] mb-1.5">
              Milliseconds the AI waits (after user silence) before speaking. Only applies when agent is set to wait for user to speak first.
            </p>
            <div className="max-w-xs flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="100"
                value={conversation.begin_after_user_silence_ms}
                onChange={(e) => setConversation((p) => ({ ...p, begin_after_user_silence_ms: parseInt(e.target.value) || 0 }))}
                placeholder="2000"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--foreground)] font-mono"
              />
              <span className="text-xs font-semibold text-[var(--muted-text)]">ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Engine & Audio Preview Section */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Mic className="h-4 w-4 text-[var(--brand-500)]" />
            Voice Engine & Audio Model
          </h3>
          <button
            onClick={() => onSaveSection("voice", voice)}
            disabled={savingSection === "voice"}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {savingSection === "voice" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {savingSection === "voice" ? "Saving..." : "Save Voice"}
          </button>
        </div>

        {/* Selected Voice Display */}
        <div className="space-y-3 text-xs">
          <label className="block font-bold text-[var(--foreground)]">Selected Voice</label>
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-600/40 text-blue-200 border border-blue-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                {selectedVoiceName.replace(/^retell-/, "").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[var(--foreground)] truncate">{selectedVoiceName.replace(/^retell-/, "")}</p>
              </div>
            </div>
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="shrink-0 px-3.5 py-1.5 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] text-xs font-bold hover:opacity-90 transition cursor-pointer flex items-center gap-1.5"
            >
              <Mic className="h-3.5 w-3.5" />
              Change
            </button>
          </div>
        </div>

        <RetellVoiceLibraryModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          selectedVoiceId={voice.voice_id}
          onSelectVoice={(v: RetellVoice) => {
            setVoice((p) => ({ ...p, voice_id: v.voice_id, provider: v.provider || "retell" }));
            setSelectedVoiceName(v.voice_name || v.voice_id);
          }}
        />
      </div>
    </div>
  );
}

export function IntelligenceGroup({ agent, onSaveSection, savingSection }: GroupProps) {
  const agentId = agent.agent_id || agent.id;
  const [attachedKbIds, setAttachedKbIds] = useState<string[]>(agent.config?.knowledge_base_ids || []);
  const [allKbs, setAllKbs] = useState<RetellKnowledgeBaseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingKbId, setUpdatingKbId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create Knowledge Base Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"text" | "url" | "file">("text");
  const [kbName, setKbName] = useState("");
  const [snippetTitle, setSnippetTitle] = useState("");
  const [snippetText, setSnippetText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ file: File; name: string; sizeStr: string; content?: string } | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchKbState = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/knowledge`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.knowledge_base_ids)) setAttachedKbIds(data.knowledge_base_ids);
        if (Array.isArray(data.all_kbs)) setAllKbs(data.all_kbs);
      } else {
        const res2 = await fetch("/api/retell/knowledge-bases");
        if (res2.ok) {
          const list = await res2.json();
          if (Array.isArray(list)) setAllKbs(list);
        }
      }
    } catch (e: any) {
      console.error("[Fetch KB Error]", e);
      setErrorMsg("Failed to load Knowledge Bases from Retell AI.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKbState();
  }, [agentId]);

  const handleToggleKbAttachment = async (kbId: string, isCurrentlyAttached: boolean) => {
    setUpdatingKbId(kbId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/knowledge`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          knowledge_base_id: kbId,
          action: isCurrentlyAttached ? "detach" : "attach",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAttachedKbIds(data.data.knowledge_base_ids || []);
        if (Array.isArray(data.data.all_kbs)) setAllKbs(data.data.all_kbs);
      } else {
        setErrorMsg(data.error || "Failed to update Knowledge Base attachment on Retell AI.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to communicate with Retell AI API.");
    } finally {
      setUpdatingKbId(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReadingFile(true);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${Math.round(file.size / 1024)} KB`;

    const textReader = new FileReader();
    textReader.onload = (event) => {
      const textContent = (event.target?.result as string) || "";
      const base64Reader = new FileReader();
      base64Reader.onload = (bEvent) => {
        const base64Data = (bEvent.target?.result as string) || "";
        setSelectedFile({
          file,
          name: file.name,
          sizeStr,
          content: textContent,
          base64: base64Data,
        } as any);
        setReadingFile(false);
      };
      base64Reader.onerror = () => {
        setSelectedFile({
          file,
          name: file.name,
          sizeStr,
          content: textContent,
        } as any);
        setReadingFile(false);
      };
      base64Reader.readAsDataURL(file);
    };
    textReader.onerror = () => {
      setErrorMsg("Failed to read the selected file.");
      setReadingFile(false);
    };
    textReader.readAsText(file);
  };

  const handleCreateKb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbName.trim()) return;
    setCreating(true);
    setErrorMsg(null);

    try {
      const payload: any = { knowledge_base_name: kbName.trim() };

      if (createMode === "text") {
        if (!snippetText.trim()) {
          throw new Error("Please provide content / text for the Knowledge Base.");
        }
        payload.knowledge_base_texts = [{ title: snippetTitle.trim() || "Knowledge Snippet", text: snippetText.trim() }];
      } else if (createMode === "url") {
        const rawUrl = urlInput.trim();
        if (!rawUrl) {
          throw new Error("Please enter a valid web URL.");
        }
        const formattedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
        payload.knowledge_base_urls = [formattedUrl];
      } else if (createMode === "file") {
        if (!selectedFile) {
          throw new Error("Please select a file from your system to upload.");
        }
        if (selectedFile.content && selectedFile.content.trim()) {
          payload.knowledge_base_texts = [{ title: selectedFile.name, text: selectedFile.content.trim() }];
        }
        if ((selectedFile as any).base64) {
          payload.knowledge_base_files = [
            {
              name: selectedFile.name,
              content_type: selectedFile.file.type || "application/octet-stream",
              data: (selectedFile as any).base64,
            },
          ];
        }
      }

      const createRes = await fetch("/api/retell/knowledge-bases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const newKb = await createRes.json();
      if (!createRes.ok || newKb.error) {
        throw new Error(newKb.error || "Failed to create Knowledge Base on Retell AI");
      }

      if (newKb.knowledge_base_id) {
        await handleToggleKbAttachment(newKb.knowledge_base_id, false);
      }

      setIsCreateModalOpen(false);
      setKbName("");
      setSnippetTitle("");
      setSnippetText("");
      setUrlInput("");
      setSelectedFile(null);
      await fetchKbState();
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to create Knowledge Base.");
    } finally {
      setCreating(false);
    }
  };

  const [llm, setLlm] = useState<{
    model: string;
    temperature: number;
    model_temperature?: number;
    top_p: number;
    presence_penalty: number;
    frequency_penalty: number;
  }>({
    model: agent.response_engine?.model || agent.config?.llm?.model || "gpt-4o",
    temperature: agent.config?.llm?.temperature ?? 0.7,
    model_temperature: agent.config?.llm?.temperature ?? 0.7,
    top_p: agent.config?.llm?.top_p ?? 1.0,
    presence_penalty: agent.config?.llm?.presence_penalty ?? 0.0,
    frequency_penalty: agent.config?.llm?.frequency_penalty ?? 0.0,
  });

  const attachedKbs = allKbs.filter((kb) => attachedKbIds.includes(kb.knowledge_base_id));

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Knowledge RAG Section */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <Database className="h-4 w-4 text-[var(--brand-500)]" />
              Knowledge Base RAG Memory (CallAutomate)
            </h3>
            <p className="text-[11px] text-[var(--muted-text)] mt-0.5">
              Knowledge bases attached to this voice agent for AI response context
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchKbState}
              disabled={loading}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer"
              title="Refresh KBs"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--brand-500)] px-3 py-1.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New Knowledge Base
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-xs text-[var(--muted-text)]">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-500)]" />
            <span>Fetching Knowledge Bases…</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Attached KBs */}
            <div className="space-y-2">
              <label className="block font-bold text-xs text-[var(--foreground)]">
                Attached to This Agent ({attachedKbs.length})
              </label>
              {attachedKbs.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-center space-y-1">
                  <p className="font-bold text-xs text-[var(--foreground)]">No Knowledge Bases attached</p>
                  <p className="text-[11px] text-[var(--muted-text)]">
                    Attach an existing Knowledge Base from your account below or create a new one.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachedKbs.map((kb) => {
                    const isUpdating = updatingKbId === kb.knowledge_base_id;
                    return (
                      <div
                        key={kb.knowledge_base_id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                            <Database className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-[var(--foreground)]">{kb.knowledge_base_name}</p>
                            <p className="text-[10px] font-mono text-[var(--subtle-text)] mt-0.5">
                              Status: <span className="text-emerald-400 font-semibold">{kb.status || "complete"}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleKbAttachment(kb.knowledge_base_id, true)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        >
                          {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                          Detach
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* User Created KBs */}
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <label className="block font-bold text-xs text-[var(--foreground)]">
                My Created Knowledge Bases ({allKbs.length})
              </label>
              {allKbs.length === 0 ? (
                <p className="text-[11px] text-[var(--muted-text)] italic">
                  No Knowledge Bases uploaded yet. Click &quot;+ New Knowledge Base&quot; above to create one.
                </p>
              ) : (
                <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface-2)]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--surface)] border-b border-[var(--border)] text-[var(--muted-text)] font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-4">KB Name</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {allKbs.map((kb) => {
                        const isAttached = attachedKbIds.includes(kb.knowledge_base_id);
                        const isUpdating = updatingKbId === kb.knowledge_base_id;

                        return (
                          <tr key={kb.knowledge_base_id} className="hover:bg-[var(--surface)]/50 transition">
                            <td className="py-3 px-4 font-bold text-[var(--foreground)]">
                              {kb.knowledge_base_name}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                {kb.status || "complete"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {isAttached ? (
                                <button
                                  onClick={() => handleToggleKbAttachment(kb.knowledge_base_id, true)}
                                  disabled={isUpdating}
                                  className="px-3 py-1 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 font-bold text-[11px] hover:bg-rose-500/20 transition cursor-pointer flex items-center gap-1 ml-auto disabled:opacity-50"
                                >
                                  {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                                  Detach
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleKbAttachment(kb.knowledge_base_id, false)}
                                  disabled={isUpdating}
                                  className="px-3 py-1 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-bold text-[11px] hover:opacity-90 transition cursor-pointer flex items-center gap-1 ml-auto disabled:opacity-50"
                                >
                                  {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
                                  Attach
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create KB Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#141518] border border-[#2a2d36] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d36] bg-[#18191e]">
              <div className="flex items-center gap-2.5">
                <Database className="h-4 w-4 text-[var(--brand-500)]" />
                <h3 className="font-bold text-sm text-white">Create Knowledge Base</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#2a2d36] transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKb} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Knowledge Base Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Product Support Docs"
                  value={kbName}
                  onChange={(e) => setKbName(e.target.value)}
                  className="w-full bg-[#1e2028] border border-[#2e3140] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--brand-500)]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1.5">Source Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateMode("text")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer",
                      createMode === "text"
                        ? "bg-[var(--brand-500)]/10 border-[var(--brand-500)] text-white"
                        : "bg-[#1e2028] border-[#2e3140] text-slate-400 hover:text-white"
                    )}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Text Snippet
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode("url")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer",
                      createMode === "url"
                        ? "bg-[var(--brand-500)]/10 border-[var(--brand-500)] text-white"
                        : "bg-[#1e2028] border-[#2e3140] text-slate-400 hover:text-white"
                    )}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Web URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode("file")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer",
                      createMode === "file"
                        ? "bg-[var(--brand-500)]/10 border-[var(--brand-500)] text-white"
                        : "bg-[#1e2028] border-[#2e3140] text-slate-400 hover:text-white"
                    )}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    File Upload
                  </button>
                </div>
              </div>

              {createMode === "text" && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-200 mb-1">Snippet Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Return Policy"
                      value={snippetTitle}
                      onChange={(e) => setSnippetTitle(e.target.value)}
                      className="w-full bg-[#1e2028] border border-[#2e3140] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--brand-500)]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-200 mb-1">Content / Knowledge Text *</label>
                    <textarea
                      rows={4}
                      placeholder="Paste guidelines, FAQs, pricing rules, or business details here…"
                      value={snippetText}
                      onChange={(e) => setSnippetText(e.target.value)}
                      className="w-full bg-[#1e2028] border border-[#2e3140] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--brand-500)]"
                    />
                  </div>
                </div>
              )}

              {createMode === "url" && (
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Web Page URL *</label>
                  <input
                    type="text"
                    placeholder="https://example.com/docs or example.com"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full bg-[#1e2028] border border-[#2e3140] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--brand-500)]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    CallAutomate will crawl and index content from this web URL into RAG vector memory (e.g. <code className="text-white">https://docs.example.com</code>).
                  </p>
                </div>
              )}

              {createMode === "file" && (
                <div className="space-y-3">
                  <label className="block font-bold text-slate-200 mb-1">Upload Document File *</label>
                  {selectedFile ? (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--brand-500)]/40 bg-[var(--brand-500)]/10 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <File className="h-5 w-5 text-[var(--brand-500)] shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{selectedFile.name}</p>
                          <p className="text-[10px] text-slate-400">{selectedFile.sizeStr}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#2a2d36] transition cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-[#2e3140] hover:border-[var(--brand-500)] bg-[#1e2028] transition cursor-pointer">
                      <input
                        type="file"
                        accept=".txt,.pdf,.md,.doc,.docx,.csv,.json,.html"
                        onChange={handleFileSelect}
                        className="sr-only"
                      />
                      <Upload className="h-6 w-6 text-slate-400 mb-2" />
                      <p className="font-bold text-xs text-slate-200">
                        {readingFile ? "Reading File..." : "Click or Drag to Upload File"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Supports .txt, .pdf, .md, .doc, .docx, .csv, .json, .html
                      </p>
                    </label>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2a2d36]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#2e3140] text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || readingFile || !kbName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {(creating || readingFile) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{creating ? "Creating Knowledge Base…" : "Create & Attach KB"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LLM Engine Section */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[var(--brand-500)]" />
            LLM Foundation Model Settings
          </h3>
          <button
            onClick={() => onSaveSection("llm", llm)}
            disabled={savingSection === "llm"}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {savingSection === "llm" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {savingSection === "llm" ? "Saving..." : "Save LLM"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">Model Selection</label>
            <select
              value={llm.model}
              onChange={(e) => setLlm((p) => ({ ...p, model: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--foreground)] font-mono"
            >
              <optgroup label="OpenAI">
                <option value="gpt-4o">OpenAI GPT-4o (Recommended)</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
                <option value="gpt-4.1">OpenAI GPT-4.1</option>
                <option value="gpt-4.1-mini">OpenAI GPT-4.1 Mini</option>
                <option value="gpt-4.1-nano">OpenAI GPT-4.1 Nano</option>
                <option value="gpt-5">OpenAI GPT-5</option>
                <option value="gpt-5-mini">OpenAI GPT-5 Mini</option>
              </optgroup>
              <optgroup label="Anthropic Claude">
                <option value="claude-4.0-sonnet">Anthropic Claude 4.0 Sonnet</option>
                <option value="claude-4.5-sonnet">Anthropic Claude 4.5 Sonnet</option>
                <option value="claude-4.6-sonnet">Anthropic Claude 4.6 Sonnet</option>
                <option value="claude-4.5-haiku">Anthropic Claude 4.5 Haiku</option>
              </optgroup>
              <optgroup label="Google Gemini">
                <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                <option value="gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                <option value="gemini-3.0-flash">Google Gemini 3.0 Flash</option>
                <option value="gemini-3.5-flash">Google Gemini 3.5 Flash</option>
              </optgroup>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-[var(--foreground)]">Model Temperature ({llm.temperature ?? llm.model_temperature ?? llm.top_p ?? 0})</label>
              <span className="text-[10px] text-slate-400 font-mono">0.0 (Deterministic) - 1.0 (Creative)</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={llm.temperature ?? llm.model_temperature ?? llm.top_p ?? 0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setLlm((p) => ({ ...p, temperature: val, model_temperature: val, top_p: val }));
              }}
              className="w-full accent-[var(--brand-500)] mt-1"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Controls randomness. Lower values (e.g. 0.0 - 0.2) ensure deterministic AI behavior and strict tool compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommunicationGroup({ agent }: GroupProps) {
  const agentId = agent.agent_id || agent.id;
  const [allRetellNumbers, setAllRetellNumbers] = useState<RetellPhoneNumberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingNum, setUpdatingNum] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPhoneNumbers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/telephony`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.all_numbers)) {
          setAllRetellNumbers(data.all_numbers);
        }
      } else {
        const res2 = await fetch("/api/retell/phone-numbers");
        if (res2.ok) {
          const numbers = await res2.json();
          if (Array.isArray(numbers)) setAllRetellNumbers(numbers);
        }
      }
    } catch (e: any) {
      console.error("[Fetch phone numbers error]", e);
      setErrorMsg("Failed to load phone numbers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhoneNumbers();
  }, [agentId]);

  const handleToggleAttachment = async (phoneNumber: string, isCurrentlyAttached: boolean) => {
    setUpdatingNum(phoneNumber);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/telephony`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phoneNumber,
          action: isCurrentlyAttached ? "detach" : "attach",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.data?.all_numbers)) {
          setAllRetellNumbers(data.data.all_numbers);
        } else {
          await fetchPhoneNumbers();
        }
      } else {
        setErrorMsg(data.error || "Failed to update phone number attachment.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to communicate with voice server.");
    } finally {
      setUpdatingNum(null);
    }
  };

  const attachedToThisAgent = allRetellNumbers.filter((n) => {
    const inboundMatch = n.inbound_agents?.some((a) => a.agent_id === agentId) || n.inbound_agent_id === agentId;
    const outboundMatch = n.outbound_agents?.some((a) => a.agent_id === agentId) || n.outbound_agent_id === agentId;
    return inboundMatch || outboundMatch;
  });

  const freeNumbers = allRetellNumbers.filter((n) => {
    const hasInbound = (n.inbound_agents && n.inbound_agents.length > 0) || !!n.inbound_agent_id;
    const hasOutbound = (n.outbound_agents && n.outbound_agents.length > 0) || !!n.outbound_agent_id;
    return !hasInbound && !hasOutbound;
  });

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Attached Numbers Section */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-[var(--brand-500)]" />
              Attached Phone Lines
            </h3>
            <p className="text-[11px] text-[var(--muted-text)] mt-0.5">
              CallAutomate phone numbers in your account configured to route inbound and outbound calls to this agent.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/phone-numbers?tab=search"
              className="px-3.5 py-1.5 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-bold text-xs hover:opacity-90 transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Buy a Number</span>
            </a>
            <button
              onClick={fetchPhoneNumbers}
              disabled={loading}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer"
              title="Refresh numbers"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-xs text-[var(--muted-text)]">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-500)]" />
            <span>Fetching your phone numbers…</span>
          </div>
        ) : attachedToThisAgent.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-center space-y-3">
            <PhoneCall className="h-8 w-8 text-[var(--muted-text)] mx-auto opacity-50" />
            <p className="font-bold text-xs text-[var(--foreground)]">No phone numbers attached yet</p>
            <p className="text-[11px] text-[var(--muted-text)] max-w-sm mx-auto">
              Attach an available number from your account below, or buy a new number to get started.
            </p>
            <a
              href="/phone-numbers?tab=search"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-bold text-xs hover:opacity-90 transition shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Buy a Number</span>
            </a>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {attachedToThisAgent.map((num) => {
              const isUpdating = updatingNum === num.phone_number;
              const displayNum = num.phone_number_pretty || num.phone_number;

              return (
                <div
                  key={num.phone_number}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0">
                      <PhoneCall className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold font-mono text-sm text-[var(--foreground)]">{displayNum}</p>
                        {num.nickname && (
                          <span className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[10px] text-[var(--muted-text)] font-semibold border border-[var(--border)]">
                            {num.nickname}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleAttachment(num.phone_number, true)}
                    disabled={isUpdating}
                    className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
                    <span>Detach</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Unassigned Numbers Section */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              Your Purchased Phone Lines
            </h3>
            <p className="text-[11px] text-[var(--muted-text)] mt-0.5">
              Active numbers in your account ready to be assigned to this agent.
            </p>
          </div>
          <a
            href="/phone-numbers?tab=search"
            className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] font-bold text-xs transition flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5 text-[var(--brand-500)]" />
            <span>Buy More Numbers</span>
          </a>
        </div>

        {freeNumbers.length === 0 ? (
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-center space-y-3">
            <p className="text-xs font-bold text-[var(--foreground)]">No unassigned phone numbers available</p>
            <p className="text-[11px] text-[var(--muted-text)] max-w-sm mx-auto">
              All numbers in your account are currently assigned to agents, or you haven&apos;t bought any numbers yet.
            </p>
            <a
              href="/phone-numbers?tab=search"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-bold text-xs hover:opacity-90 transition shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Buy a Number Now</span>
            </a>
          </div>
        ) : (
          <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface-2)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface)] border-b border-[var(--border)] text-[var(--muted-text)] font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Nickname / Details</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {freeNumbers.map((num) => {
                  const isUpdating = updatingNum === num.phone_number;
                  const displayNum = num.phone_number_pretty || num.phone_number;

                  return (
                    <tr key={num.phone_number} className="hover:bg-[var(--surface)]/50 transition">
                      <td className="py-3.5 px-4 font-bold font-mono text-[var(--foreground)]">
                        {displayNum}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--muted-text)] font-medium">
                        {num.nickname || (num.area_code ? `Area Code ${num.area_code}` : "CallAutomate Line")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--surface)] text-slate-300 font-medium text-[10px] border border-[var(--border)]">
                          Unassigned / Free
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleAttachment(num.phone_number, false)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-bold text-xs hover:opacity-90 transition cursor-pointer flex items-center gap-1 ml-auto shadow-xs disabled:opacity-50"
                        >
                          {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
                          Attach to Agent
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function TestingGroup({ agent }: GroupProps) {
  const [testMode, setTestMode] = useState<"voice" | "chat">("voice");
  const [chatLog, setChatLog] = useState<{ role: "user" | "agent"; text: string }[]>([
    { role: "agent", text: agent.begin_message || "Hello! Thank you for calling. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [retellChatId, setRetellChatId] = useState<string | null>(null);
  const [creatingChatSession, setCreatingChatSession] = useState(false);

  // WebRTC Call States
  const [callState, setCallState] = useState<"idle" | "connecting" | "active" | "ended">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<{ role: string; content: string }[]>([]);
  const [webCallError, setWebCallError] = useState<string | null>(null);
  const retellClientRef = React.useRef<any>(null);

  useEffect(() => {
    return () => {
      if (retellClientRef.current) {
        try {
          retellClientRef.current.stopCall();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const [sendingChat, setSendingChat] = useState(false);

  const initRetellChatSession = React.useCallback(async () => {
    setCreatingChatSession(true);
    try {
      const res = await fetch(`/api/agents/${agent.agent_id || agent.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_chat", agent }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.chat_id) {
          setRetellChatId(data.chat_id);
          setChatLog([
            { role: "agent", text: agent.begin_message || "Hello! Thank you for calling. How can I help you today?" }
          ]);
        }
      }
    } catch (e) {
      console.warn("[Init Retell Chat Session Warning]", e);
    } finally {
      setCreatingChatSession(false);
    }
  }, [agent]);

  useEffect(() => {
    if (testMode === "chat" && !retellChatId) {
      initRetellChatSession();
    }
  }, [testMode, retellChatId, initRetellChatSession]);

  const handleEndRetellChat = async () => {
    if (retellChatId) {
      try {
        await fetch(`/api/agents/${agent.agent_id || agent.id}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "end_chat", chat_id: retellChatId }),
        });
        } catch (e) {
        console.warn("[End Retell Chat Warning]", e);
      }
    }
    setRetellChatId(null);
    initRetellChatSession();
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;
    const userMsg = chatInput.trim();
    setChatInput("");

    const newChatLog = [...chatLog, { role: "user" as const, text: userMsg }];
    setChatLog(newChatLog);
    setSendingChat(true);

    try {
      let activeChatId = retellChatId;
      if (!activeChatId) {
        try {
          const createRes = await fetch(`/api/agents/${agent.agent_id || agent.id}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "create_chat", agent }),
          });
          if (createRes.ok) {
            const createData = await createRes.json();
            activeChatId = createData.chat_id || null;
            if (activeChatId) setRetellChatId(activeChatId);
          }
        } catch (e) {
          console.warn("[Auto-create chat session warn]", e);
        }
      }

      const res = await fetch(`/api/agents/${agent.agent_id || agent.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_chat_completion",
          chat_id: activeChatId,
          content: userMsg,
          messages: newChatLog.map((m) => ({ role: m.role, content: m.text })),
          agent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiReply = data?.content || data?.response || `I understand your request. How else can I assist you today?`;
        setChatLog((prev) => [...prev, { role: "agent", text: aiReply }]);
      } else {
        throw new Error("Chat request failed");
      }
    } catch {
      let fallbackReply = `I received your message regarding "${userMsg}". How else may I assist you with ${agent.agent_name || agent.name || "CallAutomate Agent"}?`;
      setChatLog((prev) => [...prev, { role: "agent", text: fallbackReply }]);
    } finally {
      setSendingChat(false);
    }
  };

  const recognitionRef = React.useRef<any>(null);
  const isProcessingChatRef = React.useRef<boolean>(false);
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    if (typeof window !== "undefined" && !isMuted && !isProcessingChatRef.current) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          if (recognitionRef.current) {
            recognitionRef.current.abort();
          }
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = agent.language || "en-US";

          recognition.onstart = () => setIsListening(true);
          recognition.onresult = (event: any) => {
            const userSpeech = event.results?.[0]?.[0]?.transcript;
            if (userSpeech && userSpeech.trim() && !isProcessingChatRef.current) {
              handleUserSpeechMessage(userSpeech.trim());
            }
          };
          recognition.onerror = () => setIsListening(false);
          recognition.onend = () => setIsListening(false);

          recognitionRef.current = recognition;
          recognition.start();
        } catch (e) {
          console.warn("[Speech Recognition start error]", e);
        }
      }
    }
  };

  const handleUserSpeechMessage = async (userText: string) => {
    if (!userText.trim() || isProcessingChatRef.current) return;

    isProcessingChatRef.current = true;

    // 1. Add user message to transcript
    const updatedMessages = [...transcript, { role: "user", content: userText }];
    setTranscript(updatedMessages);

    try {
      // 2. Query real LLM agent chat endpoint
      const res = await fetch(`/api/agents/${agent.agent_id || agent.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          agent,
        }),
      });

      const data = await res.json();
      const aiReply = data?.response || `I understand. How else can I help you today?`;

      // 3. Add AI message to transcript and speak it out loud!
      setTranscript((prev) => [...prev, { role: "agent", content: aiReply }]);
      speakText(aiReply, () => {
        isProcessingChatRef.current = false;
      });
    } catch (e) {
      console.error("[Chat Response Error]", e);
      const fallbackMsg = "I received your message. How else may I assist you?";
      setTranscript((prev) => [...prev, { role: "agent", content: fallbackMsg }]);
      speakText(fallbackMsg, () => {
        isProcessingChatRef.current = false;
      });
    } finally {
      setTimeout(() => {
        isProcessingChatRef.current = false;
      }, 1000);
    }
  };

  const speakText = (text: string, onEnd?: () => void) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsAgentSpeaking(true);
        utterance.onend = () => {
          setIsAgentSpeaking(false);
          if (onEnd) onEnd();
        };
        utterance.onerror = () => {
          setIsAgentSpeaking(false);
          if (onEnd) onEnd();
        };
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("[Speech Synthesis Error]", e);
        setIsAgentSpeaking(false);
        if (onEnd) onEnd();
      }
    } else {
      if (onEnd) onEnd();
    }
  };

  const startFallbackVoiceSession = () => {
    setCallState("active");
    const greeting = agent.begin_message || "Hello! Thank you for calling. How can I help you today?";
    setTranscript([{ role: "agent", content: greeting }]);
    speakText(greeting);
  };

  const handleStartWebCall = async () => {
    setCallState("connecting");
    setWebCallError(null);
    setTranscript([]);

    try {
      // 1. Explicitly request microphone permission from the browser
      try {
        if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (micErr: any) {
        throw new Error("Microphone permission denied. Please allow microphone access in your browser settings to test voice calls.");
      }

      // 2. Build agent_override configuration object from current agent state
      const agentOverride: Record<string, any> = {};
      if (agent.voice_id) {
        agentOverride.agent = {
          voice_id: agent.voice_id,
          language: agent.language || "en-US",
        };
      }

      // 3. Request Web Call access token from Next.js backend API
      const res = await fetch("/api/retell/web-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.agent_id || agent.id,
          retell_agent_id: agent.retell_agent_id,
          agent_override: Object.keys(agentOverride).length > 0 ? agentOverride : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.access_token) {
        throw new Error(data.message || data.error || "Failed to create Web Call session.");
      }

      // If mock token is returned (e.g. key missing/mock mode), launch browser voice session directly
      if (data.access_token.startsWith("mock_")) {
        startFallbackVoiceSession();
        return;
      }

      // 4. Dynamically import RetellWebClient for WebRTC Browser environment
      const { RetellWebClient } = await import("retell-client-js-sdk");
      
      if (retellClientRef.current) {
        try {
          retellClientRef.current.stopCall();
        } catch {
          // ignore
        }
      }

      const client = new RetellWebClient();
      retellClientRef.current = client;

      client.on("call_started", () => {
        setCallState("active");
      });

      client.on("call_ended", () => {
        setCallState("ended");
        setIsAgentSpeaking(false);
      });

      client.on("agent_start_talking", () => {
        setIsAgentSpeaking(true);
      });

      client.on("agent_stop_talking", () => {
        setIsAgentSpeaking(false);
      });

      client.on("update", (update: any) => {
        if (update && Array.isArray(update.transcript)) {
          setTranscript(update.transcript);
        }
      });

      client.on("error", (err: any) => {
        console.warn("[WebRTC Client Signal Notice]", err);
        startFallbackVoiceSession();
      });

      // 5. Connect browser audio stream via WebRTC using returned access_token
      await client.startCall({
        accessToken: data.access_token,
      });

    } catch (err: any) {
      console.warn("[Start Web Call Exception, executing Browser Voice Fallback]", err);
      startFallbackVoiceSession();
    }
  };

  const handleStopWebCall = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
    if (retellClientRef.current) {
      try {
        retellClientRef.current.stopCall();
      } catch (e) {
        console.warn("[Stop Web Call warning]", e);
      }
    }
    setCallState("ended");
    setIsAgentSpeaking(false);
    setIsListening(false);
  };

  const handleToggleMute = () => {
    if (retellClientRef.current) {
      if (isMuted) {
        try {
          retellClientRef.current.unmute();
          setIsMuted(false);
        } catch {
          // ignore
        }
      } else {
        try {
          retellClientRef.current.mute();
          setIsMuted(true);
        } catch {
          // ignore
        }
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Play className="h-4 w-4 text-emerald-400" />
            Integrated Live Testing Studio
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTestMode("voice")}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer",
                testMode === "voice" ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)]" : "bg-[var(--surface-2)] text-[var(--muted-text)]"
              )}
            >
              🎙️ Live WebRTC Voice Studio
            </button>
            <button
              onClick={() => setTestMode("chat")}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer",
                testMode === "chat" ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)]" : "bg-[var(--surface-2)] text-[var(--muted-text)]"
              )}
            >
              💬 Text Chat Simulator
            </button>
          </div>
        </div>

        {testMode === "chat" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-[var(--foreground)]">CallAutomate Chat Session:</span>
                <span className="font-mono text-[11px] text-[var(--muted-text)] font-bold">
                  {creatingChatSession ? "Connecting to AI Engine..." : "Active"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleEndRetellChat}
                disabled={creatingChatSession}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--brand-500)] hover:text-white transition cursor-pointer"
              >
                New Session / Reset
              </button>
            </div>

            <div className="h-64 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3 text-xs">
              {chatLog.map((msg, i) => (
                <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                  <span className="text-[10px] font-bold text-[var(--subtle-text)] uppercase">{msg.role}</span>
                  <div className={cn("max-w-[80%] rounded-xl p-3 mt-0.5", msg.role === "user" ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)]" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]")}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message to test your Retell AI agent prompt..."
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--foreground)]"
              />
              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="rounded-xl bg-[var(--brand-500)] px-4 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {sendingChat && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{sendingChat ? "Thinking..." : "Send"}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            {webCallError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{webCallError}</span>
              </div>
            )}

            <div className="p-8 flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-center relative overflow-hidden">
              {/* Voice Visualizer Indicator */}
              <div className="relative">
                <div className={cn(
                  "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300",
                  callState === "active"
                    ? isAgentSpeaking
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-110"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : callState === "connecting"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
                    : "bg-[var(--surface)] text-[var(--muted-text)] border border-[var(--border)]"
                )}>
                  {callState === "connecting" ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : callState === "active" ? (
                    isAgentSpeaking ? <Volume2 className="h-7 w-7 animate-bounce" /> : <Mic className="h-7 w-7" />
                  ) : (
                    <Mic className="h-7 w-7" />
                  )}
                </div>

                {callState === "active" && isAgentSpeaking && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <div>
                <p className="font-bold text-[var(--foreground)] text-sm flex items-center justify-center gap-2">
                  <span>WebRTC Direct Audio Call (CallAutomate)</span>
                  {callState === "active" && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                      ● LIVE AUDIO
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--muted-text)] mt-1">
                  {callState === "connecting"
                    ? "Establishing WebRTC encrypted audio connection with CallAutomate..."
                    : callState === "active"
                    ? isAgentSpeaking ? "AI Agent is speaking..." : "Microphone active — start speaking to test your voice agent live!"
                    : callState === "ended"
                    ? "Call ended. Click below to start a new web audio test session."
                    : "Connect your microphone to simulate a live 2-way phone call in your browser."}
                </p>
              </div>

              {/* Call Controls */}
              <div className="flex items-center gap-3 pt-2">
                {callState === "idle" || callState === "ended" ? (
                  <button
                    onClick={handleStartWebCall}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-600 cursor-pointer transition"
                  >
                    <Mic className="h-4 w-4" />
                    <span>Start Live Web Audio Session</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleToggleMute}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer border",
                        isMuted
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--surface-2)]"
                      )}
                    >
                      {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      <span>{isMuted ? "Unmute Mic" : "Mute Mic"}</span>
                    </button>

                    <button
                      onClick={handleStopWebCall}
                      className="flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-600 cursor-pointer transition"
                    >
                      <PhoneOff className="h-4 w-4" />
                      <span>End Web Call</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Live Call Voice/Text Interactive Input */}
            {callState === "active" && (
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] space-y-3">
                <p className="text-xs font-bold text-[var(--foreground)] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                    Live Voice Session Active — Speak or Type to AI
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {isListening ? "● Listening to microphone..." : "Audio output: Active"}
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startListening()}
                    disabled={isListening || isAgentSpeaking}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer border shrink-0",
                      isListening
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                    )}
                  >
                    <Mic className="h-4 w-4" />
                    <span>{isListening ? "Listening..." : "🎙️ Click to Speak"}</span>
                  </button>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const input = form.elements.namedItem("userReply") as HTMLInputElement;
                      const val = input?.value?.trim();
                      if (!val) return;
                      input.value = "";
                      handleUserSpeechMessage(val);
                    }}
                    className="flex flex-1 gap-2"
                  >
                    <input
                      type="text"
                      name="userReply"
                      placeholder="Type a message or click microphone to speak..."
                      className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--brand-500)]"
                    />
                    <button
                      type="submit"
                      disabled={isAgentSpeaking}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer shadow-xs transition"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Realtime Call Transcript */}
            {transcript.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                  Live WebRTC Call Transcript
                </p>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-2.5 text-xs">
                  {transcript.map((item, i) => (
                    <div key={i} className={cn("flex flex-col", item.role === "user" ? "items-end" : "items-start")}>
                      <span className="text-[9px] font-bold text-[var(--subtle-text)] uppercase">{item.role}</span>
                      <div className={cn(
                        "max-w-[85%] rounded-xl px-3 py-2 text-xs mt-0.5",
                        item.role === "user"
                          ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-medium"
                          : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] font-mono"
                      )}>
                        {item.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function AnalyticsGroup({ agent }: GroupProps) {
  const agentId = agent.agent_id || agent.id;
  const [data, setData] = useState<{
    total_calls: number;
    success_rate: string;
    avg_latency: string;
    calls: any[];
  }>({
    total_calls: 0,
    success_rate: "100%",
    avg_latency: "620ms",
    calls: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/analytics`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.warn("[Analytics Fetch Error]", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [agentId]);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Metrics Row (Cost Removed!) */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--brand-500)]" />
            Agent Performance & Telemetry
          </h3>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer"
            title="Refresh analytics"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <p className="text-[var(--subtle-text)] font-semibold">Total Calls</p>
            <p className="text-xl font-extrabold text-[var(--foreground)] mt-1">
              {loading ? "..." : data.total_calls}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <p className="text-[var(--subtle-text)] font-semibold">Success Rate</p>
            <p className="text-xl font-extrabold text-emerald-400 mt-1">
              {loading ? "..." : data.success_rate}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <p className="text-[var(--subtle-text)] font-semibold">Avg Latency</p>
            <p className="text-xl font-extrabold text-[var(--brand-500)] mt-1">
              {loading ? "..." : data.avg_latency}
            </p>
          </div>
        </div>
      </div>

      {/* Agent Call Logs Table */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="border-b border-[var(--border)] pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-emerald-400" />
              Agent Call Logs
            </h3>
            <p className="text-[11px] text-[var(--muted-text)] mt-0.5">
              Live call logs for this agent fetched directly via CallAutomate REST API
            </p>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted-text)] font-semibold border border-[var(--border)]">
            {data.calls.length} Logs
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--muted-text)] flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-500)]" />
            <span>Fetching call logs...</span>
          </div>
        ) : data.calls.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-center space-y-2">
            <PhoneCall className="h-8 w-8 text-[var(--muted-text)] mx-auto opacity-50" />
            <p className="font-bold text-xs text-[var(--foreground)]">No call logs found</p>
            <p className="text-[11px] text-[var(--muted-text)] max-w-sm mx-auto">
              Place a test call via the Testing Studio or phone line to view telemetry call logs here.
            </p>
          </div>
        ) : (
          <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface-2)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface)] border-b border-[var(--border)] text-[var(--muted-text)] font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Contact / Source</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Disconnection Reason</th>
                  <th className="py-3 px-4">User Sentiment</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.calls.map((call: any, idx: number) => {
                  const isPositive = call.sentiment === "positive";
                  const isNegative = call.sentiment === "negative";
                  const dateStr = call.created_at
                    ? new Date(call.created_at).toLocaleString()
                    : "Recent";

                  return (
                    <tr key={call.call_id || idx} className="hover:bg-[var(--surface)]/50 transition">
                      <td className="py-3 px-4 font-bold font-mono text-[var(--foreground)]">
                        {call.from_number || "Web Call"}
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--foreground)]">
                        {call.duration_str || "00:45"}
                      </td>
                      <td className="py-3 px-4 text-[var(--muted-text)] capitalize">
                        {call.disconnection_reason?.replace(/_/g, " ") || "Completed"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                            isPositive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : isNegative
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}
                        >
                          {call.sentiment || "Neutral"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--brand-500)]">
                        {call.latency_ms}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-[var(--subtle-text)]">
                        {dateStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function PublishingGroup({ agent }: GroupProps) {
  const [publishing, setPublishing] = React.useState(false);
  const [rollingBackVer, setRollingBackVer] = React.useState<number | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [currentVer, setCurrentVer] = React.useState(agent.version || 1);
  const [versions, setVersions] = React.useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = React.useState(true);

  const fetchVersions = React.useCallback(async () => {
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/agents/${agent.agent_id || agent.id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(Array.isArray(data.versions) ? data.versions : []);
      }
    } catch (e) {
      console.warn("[Fetch Agent Versions Warning]", e);
    } finally {
      setLoadingVersions(false);
    }
  }, [agent.agent_id, agent.id]);

  React.useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handlePublishCurrent = async () => {
    setPublishing(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/agents/${agent.agent_id || agent.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: currentVer }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const nextVer = data.version || currentVer + 1;
        setCurrentVer(nextVer);
        setMsg(`✅ Version v${nextVer} published to production!`);
        fetchVersions();
      } else {
        alert(data.error || "Failed to publish agent.");
      }
    } catch (e: any) {
      alert(e.message || "Failed to publish agent.");
    } finally {
      setPublishing(false);
    }
  };

  const handleRollbackToVersion = async (targetVersion: number) => {
    if (!confirm(`Are you sure you want to rollback to v${targetVersion} and publish it as the active version?`)) {
      return;
    }

    setRollingBackVer(targetVersion);
    setMsg(null);
    try {
      const res = await fetch(`/api/agents/${agent.agent_id || agent.id}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetVersion }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const newPublishedVer = data.new_published_version || targetVersion + 1;
        setCurrentVer(newPublishedVer);
        setMsg(`✅ Successfully rolled back to v${targetVersion} (Published as v${newPublishedVer})!`);
        fetchVersions();
      } else {
        alert(data.error || `Failed to rollback to v${targetVersion}`);
      }
    } catch (e: any) {
      alert(e.message || `Failed to rollback to v${targetVersion}`);
    } finally {
      setRollingBackVer(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Tag className="h-4 w-4 text-[var(--brand-500)]" />
            Agent Version Control & Rollback Center
          </h3>
          <button
            onClick={fetchVersions}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--muted-text)] hover:bg-[var(--surface-2)] cursor-pointer"
            title="Refresh Versions"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-[var(--subtle-text)] block">Active Deployment Status:</span>
            <span className="font-extrabold text-sm uppercase text-emerald-400">Published Active</span>
          </div>
          <div>
            <span className="text-[var(--subtle-text)] block">Current Version Number:</span>
            <span className="font-mono font-extrabold text-sm text-[var(--foreground)]">v{currentVer}</span>
          </div>
          <button
            onClick={handlePublishCurrent}
            disabled={publishing}
            className="flex items-center gap-2 rounded-xl bg-[var(--brand-500)] px-5 py-2.5 text-xs font-bold text-[var(--brand-btn-text)] shadow-md hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
            {publishing ? "Publishing..." : `Publish Current Draft (v${currentVer})`}
          </button>
        </div>

        {/* Version History List & Rollback Actions */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">All Agent Versions</h4>

          {loadingVersions ? (
            <div className="p-6 text-center text-xs text-[var(--muted-text)] flex justify-center items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-500)]" />
              Fetching version history from Retell...
            </div>
          ) : versions.length === 0 ? (
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--muted-text)] text-center">
              No version history recorded yet. Publish your first version above.
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((verObj: any, idx: number) => {
                const verNum = Number(verObj.version || verObj.base_version || idx + 1);
                const isCurrent = verNum === currentVer;
                const isRolling = rollingBackVer === verNum;
                const title = verObj.version_title || verObj.title || `Version ${verNum}`;
                const dateStr = verObj.created_at ? new Date(verObj.created_at).toLocaleString() : `Version ${verNum}`;

                return (
                  <div
                    key={verObj.version_id || verObj.id || `ver-${verNum}-${idx}`}
                    className={cn(
                      "p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-all",
                      isCurrent
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : "bg-[var(--surface-2)] border-[var(--border)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold font-mono",
                        isCurrent ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)]"
                      )}>
                        v{verNum}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[var(--foreground)]">{title}</span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-[9px] uppercase font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--subtle-text)]">{dateStr}</span>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => handleRollbackToVersion(verNum)}
                        disabled={isRolling || rollingBackVer !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--brand-500)] hover:text-white transition cursor-pointer disabled:opacity-50"
                      >
                        {isRolling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        {isRolling ? "Rolling back..." : `Rollback & Publish v${verNum}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
