"use client";

import React, { useState, useEffect } from "react";
import { Database, Plus, Search, RefreshCw, FileText, Globe, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export default function KnowledgePage() {
  const [kbList, setKbList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchKbs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/knowledge-base");
      if (res.ok) {
        const data = await res.json();
        setKbList(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKbs();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Knowledge Base Hub"
          description="Manage RAG documents and knowledge sources to feed your AI voice agents."
        />
        <button
          onClick={() => fetchKbs()}
          className="rounded-xl border border-[var(--border)] p-2 text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-64 w-full" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kbList.map((kb) => (
            <div key={kb.knowledge_base_id} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-100)] text-[var(--brand-500)] font-bold">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--foreground)] text-sm">{kb.knowledge_base_name}</h3>
                    <p className="text-[10px] font-mono text-[var(--subtle-text)]">{kb.knowledge_base_id}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 font-bold uppercase">
                  {kb.status || "Complete"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
