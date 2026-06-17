import type { ReactNode } from "react";

type ModalDrawerShellProps = {
  title: string;
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
};

export function ModalDrawerShell({ title, open, onClose, children }: ModalDrawerShellProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Clickable Backdrop Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <aside className="relative z-10 flex h-full w-full max-w-md flex-col shadow-2xl transition-transform duration-300 border-l"
             style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex shrink-0 items-center justify-between border-b p-5" style={{ borderColor: "var(--border)", background: "linear-gradient(to bottom, var(--surface-2), transparent)" }}>
          <h3 className="text-base font-bold text-[var(--foreground)]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-xs font-semibold transition-all cursor-pointer"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
              color: "var(--muted-text)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--brand-500)";
              e.currentTarget.style.color = "var(--brand-500)";
              e.currentTarget.style.background = "var(--surface)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--muted-text)";
              e.currentTarget.style.background = "var(--surface-2)";
            }}
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </aside>
    </div>
  );
}
