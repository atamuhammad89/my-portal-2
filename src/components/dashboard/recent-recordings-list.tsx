"use client";

import { useRef, useState } from "react";
import { Recording } from "@/types/recording";
import { formatDuration } from "@/utils/format";

function formatDateSafe(raw: string | null | undefined): string {
  if (!raw) return "—";
  const ts = Number(raw);
  const d = isNaN(ts) ? new Date(raw) : new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function InlineAudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    playing ? el.pause() : el.play();
    setPlaying(!playing);
  }

  function fmtTime(s: number) {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  }

  return (
    <div className="rounded-xl border p-4" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (!el) return;
          setCurrentTime(el.currentTime);
          setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0);
        }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); }}
        crossOrigin="anonymous"
        preload="metadata"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-black shadow transition active:scale-95 cursor-pointer hover:shadow-[0_0_10px_rgba(0,240,255,0.4)]"
          style={{ background: "var(--brand-500)" }}
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="4" height="10" rx="1"/>
              <rect x="7" y="1" width="4" height="10" rx="1"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 1.5l9 4.5-9 4.5z"/>
            </svg>
          )}
        </button>
        <div className="flex flex-1 flex-col gap-1">
          <input
            type="range" min={0} max={100} value={progress}
            onChange={(e) => {
              const el = audioRef.current;
              if (!el) return;
              const t = (Number(e.target.value) / 100) * el.duration;
              el.currentTime = t;
              setCurrentTime(t);
              setProgress(Number(e.target.value));
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-[var(--brand-500)]"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{fmtTime(currentTime)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>
        <a
          href={url} download target="_blank" rel="noreferrer"
          title="Download MP3"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-slate-400 hover:text-white hover:bg-white/5 transition"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6.5 1.5v7M3.5 6l3 3 3-3M1.5 11.5h10" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>
    </div>
  );
}

type RecentRecordingsListProps = {
  rows: Recording[];
};

export function RecentRecordingsList({ rows }: RecentRecordingsListProps) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed py-8 text-center text-sm text-slate-500" style={{ borderColor: "var(--border)" }}>
        No recordings available yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article key={row.id} className="rounded-xl border p-4 shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                {row.customerNumber !== "—" ? row.customerNumber : "Unknown Caller"}
              </p>
              <p className="text-xs text-slate-400">Agent: {row.agentName}</p>
            </div>
            <p className="text-xs text-slate-400">
              {formatDuration(row.durationSeconds)} &middot; {formatDateSafe(row.createdAt)}
            </p>
          </div>
          <InlineAudioPlayer url={row.audioUrl} />
        </article>
      ))}
    </div>
  );
}
