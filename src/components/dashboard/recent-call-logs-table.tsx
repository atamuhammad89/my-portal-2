"use client";

import { useState, useRef, ReactNode } from "react";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CallLog, CallStatus } from "@/types/call-log";
import { formatDuration } from "@/utils/format";
import { CallDetailDrawer } from "@/components/call-logs/call-logs-shell";

function formatDateSafe(raw: string | null | undefined): string {
  if (!raw) return "—";

  const ts = Number(raw);

  let d: Date;

  if (!isNaN(ts)) {
    // Detect seconds vs ms: Unix-seconds are ~10 digits (< 1e11)
    d = ts < 1e11 ? new Date(ts * 1000) : new Date(ts);
  } else if (raw.includes("/")) {
    // Handle DD/MM/YYYY manually
    const [datePart, timePart] = raw.split(",").map(s => s.trim());
    const [day, month, year] = datePart.split("/");

    const iso = `${year}-${month}-${day}T${timePart || "00:00:00"}`;
    d = new Date(iso);
  } else {
    d = new Date(raw);
  }

  if (isNaN(d.getTime())) return "—";

  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusVariant(status: CallStatus) {
  if (status === "passed") return "success" as const;
  if (status === "failed") return "danger" as const;
  return "warning" as const;
}

export function InlineAudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play();
    }
    setPlaying(!playing);
  }

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        preload="none"
        crossOrigin="anonymous"
      />
      <button
        onClick={toggle}
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full text-black shadow transition active:scale-95 cursor-pointer bg-[var(--brand-500)] hover:shadow-[0_0_8px_rgba(0,240,255,0.4)]"
      >
        {playing ? (
          <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor">
            <rect x="2" y="1" width="3" height="10" rx="0.5" />
            <rect x="7" y="1" width="3" height="10" rx="0.5" />
          </svg>
        ) : (
          <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor">
            <path d="M3 2l7 4-7 4z" />
          </svg>
        )}
      </button>
      <a
        href={url}
        download
        target="_blank"
        rel="noreferrer"
        title="Download"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer"
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 13 13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            d="M6.5 1.5v7M3.5 6l3 3 3-3M1.5 11.5h10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </div>
  );
}

type RecentCallLogsTableProps = {
  rows: CallLog[];
  hideCost?: boolean;
  showDetails?: boolean;
  showRecording?: boolean;
  hideMeta?: boolean;
};

export function RecentCallLogsTable({
  rows,
  hideCost = false,
  showDetails = false,
  showRecording = false,
  hideMeta = false,
}: RecentCallLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);

  if (!rows.length) {
    return <p className="text-sm text-slate-400">No recent call logs.</p>;
  }

  // Sort descending by startedAt (newest first)
  const sortedRows = [...rows].sort((a, b) => {
    const getTime = (val: string | null | undefined) => {
      if (!val) return 0;

      const ts = Number(val);

      if (!isNaN(ts)) {
        // Detect seconds vs ms: Unix-seconds are ~10 digits (< 1e11)
        return ts < 1e11 ? ts * 1000 : ts;
      }

      if (val.includes("/")) {
        const [datePart, timePart] = val.split(",").map(s => s.trim());
        const [day, month, year] = datePart.split("/");
        return new Date(`${year}-${month}-${day}T${timePart || "00:00:00"}`).getTime();
      }

      return new Date(val).getTime();
    };

    return getTime(b.startedAt) - getTime(a.startedAt); // descending
  });

  // Build columns dynamically
  const columns: {
    key: keyof CallLog;
    label: string;
    render?: (value: any, row: CallLog) => ReactNode;
  }[] = [
    {
      key: "startedAt",
      label: "Date / Time",
      render: (value: any) => (
        <span className="whitespace-nowrap text-slate-700">
          {formatDateSafe(String(value))}
        </span>
      ),
    },
    {
      key: "fromNumber",
      label: "From",
      render: (value: any) => (
        <span className="font-mono text-sm">{String(value) || "—"}</span>
      ),
    },
    {
      key: "durationSeconds",
      label: "Duration",
      render: (value: any) => (
        <span className="whitespace-nowrap">{formatDuration(Number(value))}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: any) => (
        <StatusBadge
          text={String(value).charAt(0).toUpperCase() + String(value).slice(1)}
          variant={getStatusVariant(value as CallStatus)}
        />
      ),
    },
  ];

  if (!hideCost) {
    columns.push({
      key: "cost",
      label: "Cost",
      render: (value: any) =>
        value !== null && value !== undefined ? (
          <span className="font-mono text-slate-700">${Number(value).toFixed(2)}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    });
  }

  if (showRecording) {
    columns.push({
      key: "recordingUrl",
      label: "Recording",
      render: (value: any, row: CallLog) =>
        value ? (
          <InlineAudioPlayer url={String(value)} />
        ) : (
          <span className="text-xs text-slate-400">No recording</span>
        ),
    });
  }

  if (showDetails) {
    columns.push({
      key: "id",
      label: "Details",
      render: (_value: any, row: CallLog) => (
        <button
          type="button"
          onClick={() => setSelectedLog(row)}
          className="rounded-lg px-3 py-1 text-xs font-bold text-[var(--brand-btn-text)] bg-[var(--brand-500)] transition active:scale-95 hover:bg-[var(--foreground)] hover:text-[var(--background)] cursor-pointer hover:shadow-[var(--card-hover-shadow)]"
        >
          View Details
        </button>
      ),
    });
  }

  return (
    <>
      <DataTable rows={sortedRows} columns={columns} />
      {selectedLog && (
        <CallDetailDrawer
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          hideMeta={hideMeta}
        />
      )}
    </>
  );
}