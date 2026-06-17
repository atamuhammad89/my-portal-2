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
        background: "var(--page-header-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--border)",
        boxShadow: "var(--page-header-shadow)"
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

      <div className="relative space-y-1.5 z-10">
        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--success-fg)] bg-[var(--success-bg)] border border-[var(--success-fg)]/25">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--success-fg)] animate-pulse" />
          Voice Service Console Active
        </div>
        <h2
          className="text-2xl font-bold tracking-tight md:text-3xl text-[var(--foreground)]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {title}
        </h2>
        {description ? (
          <p className="text-sm font-medium leading-relaxed max-w-lg text-[var(--muted-text)]">
            {description}
          </p>
        ) : null}
      </div>
      


      {action ? <div className="relative z-10">{action}</div> : null}
    </div>
  );
}
