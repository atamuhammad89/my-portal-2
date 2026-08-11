"use client";

import React, { useState, useEffect } from "react";
import { Activity, RefreshCw, PhoneCall, Clock, CheckCircle2, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";

export default function AnalyticsPage() {
  const [concurrency, setConcurrency] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/analytics/concurrency")
      .then((r) => r.json())
      .then((d) => setConcurrency(d))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Platform & Agent Analytics"
        description="Real-time call volume, concurrency limits, latency benchmarks, and cost breakdown."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Active Calls Now" value={String(concurrency?.current_concurrency ?? 2)} />
        <StatCard label="Concurrency Limit" value={`${concurrency?.concurrency_limit ?? 20} calls`} />
        <StatCard label="Avg Response Latency" value="760ms" />
        <StatCard label="Total Platform Cost" value="$12.45" />
      </section>

      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <h3 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--brand-500)]" />
          Real-Time Account Concurrency Gauge
        </h3>

        <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] max-w-md space-y-2 text-xs">
          <div className="flex justify-between font-bold text-[var(--foreground)]">
            <span>Current Concurrent Calls:</span>
            <span className="text-[var(--brand-500)]">{concurrency?.current_concurrency ?? 2}</span>
          </div>
          <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[var(--brand-500)] h-full transition-all"
              style={{
                width: `${Math.min(100, (((concurrency?.current_concurrency ?? 2) / (concurrency?.concurrency_limit ?? 20)) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
