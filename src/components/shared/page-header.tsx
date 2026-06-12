import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl px-6 py-6 md:flex-row md:items-center md:justify-between relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(13, 20, 36, 0.45) 0%, rgba(18, 27, 48, 0.3) 100%)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 30px rgba(0, 240, 255, 0.02)"
      }}
    >
      {/* Subtle neon light ray/gradient in background */}
      <div
        className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-10 blur-xl"
        style={{ background: "var(--brand-500)" }}
      />
      <div
        className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full opacity-5 blur-xl"
        style={{ background: "var(--brand-500)" }}
      />

      <div className="relative space-y-1.5">
        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--brand-500)] bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.15)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)] animate-pulse" />
          Voice Service Console Active
        </div>
        <h2
          className="text-2xl font-bold text-white tracking-tight md:text-3xl"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {title}
        </h2>
        {description ? (
          <p className="text-sm font-medium leading-relaxed max-w-2xl" style={{ color: "var(--muted-text)" }}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="relative">{action}</div> : null}
    </div>
  );
}
