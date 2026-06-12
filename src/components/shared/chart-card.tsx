import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <article
      className="rounded-xl px-5 pt-5 pb-4 overflow-hidden"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border)"
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{
            background: "var(--brand-500)",
            boxShadow: "0 0 8px var(--brand-500)"
          }}
        />
        <h3
          className="text-sm font-semibold text-white"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {title}
        </h3>
      </div>
      {subtitle ? (
        <p className="text-xs mb-4 ml-4.5" style={{ color: "var(--subtle-text)" }}>{subtitle}</p>
      ) : <div className="mb-4" />}
      <div className="h-72">{children}</div>
    </article>
  );
}
