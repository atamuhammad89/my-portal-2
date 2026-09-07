import React from "react";

type EmptyStateProps = {
  title: string;
  message: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-8 text-center space-y-2 my-2 transition-all">
      <h4 className="text-base font-bold text-[var(--foreground)]">{title}</h4>
      <p className="text-xs text-[var(--muted-text)] max-w-md mx-auto leading-relaxed">{message}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
