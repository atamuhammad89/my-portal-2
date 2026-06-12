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
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <aside className="relative z-10 flex h-full w-full max-w-md flex-col shadow-2xl transition-transform duration-300 border-l"
             style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex shrink-0 items-center justify-between border-b p-5" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-base font-bold text-white" style={{ color: "#ffffff" }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)] px-3 py-1.5 text-xs font-semibold transition cursor-pointer hover:bg-white hover:text-black hover:border-white"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </aside>
    </div>
  );
}
