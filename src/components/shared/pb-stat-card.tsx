"use client";

import { ReactNode } from "react";

type Accent = "cyan" | "green" | "purple" | "pink" | "orange" | "blue";

type PbStatCardProps = {
  label: string;
  value: string;
  subtext?: string;
  icon: ReactNode;
  accent?: Accent;
};

const accentMap: Record<Accent, { bg: string; shadow: string; border: string }> = {
  cyan:   { bg: "linear-gradient(135deg,#00d4ff,#0099cc)", shadow: "0 4px 16px rgba(0,212,255,0.35)", border: "rgba(0,212,255,0.25)" },
  green:  { bg: "linear-gradient(135deg,#22c55e,#16a34a)", shadow: "0 4px 16px rgba(34,197,94,0.35)",  border: "rgba(34,197,94,0.25)"  },
  purple: { bg: "linear-gradient(135deg,#a855f7,#7c3aed)", shadow: "0 4px 16px rgba(168,85,247,0.35)", border: "rgba(168,85,247,0.25)" },
  pink:   { bg: "linear-gradient(135deg,#ec4899,#be185d)", shadow: "0 4px 16px rgba(236,72,153,0.35)", border: "rgba(236,72,153,0.25)" },
  orange: { bg: "linear-gradient(135deg,#f97316,#ea580c)", shadow: "0 4px 16px rgba(249,115,22,0.35)", border: "rgba(249,115,22,0.25)"  },
  blue:   { bg: "linear-gradient(135deg,#3b82f6,#1d4ed8)", shadow: "0 4px 16px rgba(59,130,246,0.35)", border: "rgba(59,130,246,0.25)"  },
};

export function PbStatCard({
  label,
  value,
  subtext,
  icon,
  accent = "cyan",
}: PbStatCardProps) {
  const a = accentMap[accent];
  return (
    <article
      className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:translate-y-[-3px]"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Subtle glow blob top-right */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: a.bg,
          opacity: 0.06,
          filter: "blur(30px)",
          transform: "translate(30%, -30%)",
        }}
      />

      <p
        className="text-[10px] font-bold uppercase tracking-widest relative z-10"
        style={{ color: "var(--muted-text)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
      >
        {label}
      </p>

      <div className="flex items-center gap-4 relative z-10">
        {/* Icon circle */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
          style={{
            background: a.bg,
            boxShadow: a.shadow,
          }}
        >
          <span className="h-6 w-6 flex items-center justify-center">
            {icon}
          </span>
        </div>

        {/* Value + subtext */}
        <div className="flex-1 min-w-0">
          <p
            className="text-3xl font-extrabold tracking-tight leading-none"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--foreground)" }}
          >
            {value}
          </p>
          {subtext && (
            <p
              className="text-xs mt-1 font-medium"
              style={{ color: "var(--muted-text)" }}
            >
              {subtext}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
