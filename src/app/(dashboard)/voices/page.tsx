"use client";

import React, { useState, useEffect } from "react";
import { Mic, Plus, RefreshCw, Volume2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export default function VoicesPage() {
  const [voices, setVoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVoices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/voices");
      if (res.ok) {
        setVoices(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVoices();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Voice Catalog & Cloning"
          description="Browse ElevenLabs, Cartesia, and OpenAI voice presets or clone custom voice profiles."
        />
        <button
          onClick={() => fetchVoices()}
          className="rounded-xl border border-[var(--border)] p-2 text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-64 w-full" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {voices.map((v) => (
            <div key={v.voice_id} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-[var(--foreground)]">{v.voice_name || v.voice_id}</p>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-[var(--surface-2)] text-[var(--brand-500)] border border-[var(--border)]">
                  {v.provider}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[var(--subtle-text)]">{v.voice_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
