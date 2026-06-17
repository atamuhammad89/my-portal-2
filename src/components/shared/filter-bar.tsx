import type { ReactNode } from "react";

type FilterBarProps = {
  children: ReactNode;
};

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4 shadow-sm md:flex-row md:items-center md:justify-between" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
      {children}
    </div>
  );
}
