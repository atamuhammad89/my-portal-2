"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot, ArrowLeft, Mic, Sparkles, Loader2, Globe, MessageSquare, Code
} from "lucide-react";
import { RetellVoiceLibraryModal } from "@/components/agents/editor/retell-voice-library-modal";
import { RETELL_VOICE_CATALOG } from "@/lib/retell-voices-catalog";
import type { RetellVoice } from "@/types/retell";

export default function NewAgentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    language: "en-US",
    voice_id: "retell-Cimo",
    model: "gpt-4o",
    begin_message: "Hello! Thank you for calling. How can I help you today?",
    general_prompt: "You are a helpful, professional, and friendly AI voice assistant.",
  });

  const selectedVoiceObj = RETELL_VOICE_CATALOG.find((v) => v.voice_id === form.voice_id);
  const selectedVoiceName = selectedVoiceObj?.voice_name || form.voice_id.replace(/^retell-/, "").replace(/_/g, " ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg("Please enter an agent name.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/retell/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: form.name.trim(),
          voice_id: form.voice_id,
          language: form.language,
          begin_message: form.begin_message,
          general_prompt: form.general_prompt,
          response_engine: {
            type: "retell-llm",
            model: form.model,
          },
        }),
      });

      if (res.ok) {
        const created = await res.json();
        const createdId = created.agent_id || created.id;
        router.push(`/agents/${createdId}`);
      } else {
        const err = await res.json();
        setErrorMsg(err.message || "Failed to create agent.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/agents")}
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer"
            title="Back to Agents"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-[var(--foreground)] flex items-center gap-2">
              <Bot className="h-5 w-5 text-[var(--brand-500)]" />
              Create Voice Agent
            </h1>
            <p className="text-xs text-[var(--muted-text)] mt-0.5">
              Set up a new AI agent and open it directly in the Agent Editor.
            </p>
          </div>
        </div>
      </div>

      {/* Main Agent Creation Form */}
      <form onSubmit={handleSubmit} className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="space-y-5 text-xs">
          {/* Agent Name */}
          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1.5 text-xs">
              Agent Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Customer Support Representative"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30 font-medium placeholder-[var(--subtle-text)]"
              required
              autoFocus
            />
          </div>

          {/* Voice & Language Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[var(--foreground)] mb-1.5 flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5 text-[var(--brand-500)]" />
                Voice Profile
              </label>
              
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-600/40 text-blue-200 border border-blue-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedVoiceName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-[var(--foreground)] truncate">{selectedVoiceName}</p>
                    <p className="text-[10px] text-[var(--subtle-text)] truncate">
                      {selectedVoiceObj?.trait || `${selectedVoiceObj?.accent || "Natural"} · ${selectedVoiceObj?.gender || "Voice"}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="shrink-0 px-3.5 py-2 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] text-xs font-bold hover:opacity-90 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Mic className="h-3.5 w-3.5" />
                  Select Voice
                </button>
              </div>

              <RetellVoiceLibraryModal
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                selectedVoiceId={form.voice_id}
                onSelectVoice={(v: RetellVoice) => {
                  setForm((p) => ({ ...p, voice_id: v.voice_id }));
                }}
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--foreground)] mb-1.5 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-[var(--brand-500)]" />
                Primary Language
              </label>
              <select
                value={form.language}
                onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--foreground)] font-medium"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
              </select>
            </div>
          </div>

          {/* Greeting Message */}
          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-[var(--brand-500)]" />
              Initial Greeting Message
            </label>
            <textarea
              rows={2}
              value={form.begin_message}
              onChange={(e) => setForm((p) => ({ ...p, begin_message: e.target.value }))}
              placeholder="Message spoken when call starts..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--foreground)] font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--brand-500)]" />
              System Prompt & Instructions
            </label>
            <textarea
              rows={5}
              value={form.general_prompt}
              onChange={(e) => setForm((p) => ({ ...p, general_prompt: e.target.value }))}
              placeholder="Instructions defining the agent's behavior, tone, and goals..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--foreground)] font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => router.push("/agents")}
            className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted-text)] hover:bg-[var(--surface-2)] text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-bold text-xs hover:opacity-90 transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            <span>{isSubmitting ? "Creating Agent..." : "Create & Open Agent Editor"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
