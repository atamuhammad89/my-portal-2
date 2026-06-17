import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  change?: string;
  icon?: ReactNode;
  subtext?: string;
  sparklineColor?: "blue" | "green" | "purple" | "orange";
};

export function StatCard({
  label,
  value,
  change,
  icon,
  subtext,
  sparklineColor = "blue",
}: StatCardProps) {
  const positive = change?.startsWith("+");
  const negative = change?.startsWith("-");

  // Sparkline color mapping
  const strokeColor = {
    blue: "#2563eb",
    green: "#10b981",
    purple: "#8b5cf6",
    orange: "#f97316"
  }[sparklineColor] || "#2563eb";

  return (
    <article
      className="rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[var(--card-hover-shadow)]"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-start gap-4.5 relative z-10">
        {/* Left side: Icon Badge */}
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl shadow-xs shrink-0"
               style={{
                 background: {
                   blue: "rgba(37, 99, 235, 0.08)",
                   green: "rgba(16, 185, 129, 0.08)",
                   purple: "rgba(139, 92, 246, 0.08)",
                   orange: "rgba(249, 115, 22, 0.08)"
                 }[sparklineColor],
                 border: `1px solid ${strokeColor}18`,
                 color: strokeColor
               }}
          >
            {icon}
          </div>
        )}
        
        {/* Right side: Text Metrics */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--subtle-text)] font-sans">
            {label}
          </p>
          <p className="text-2xl font-bold mt-1 text-[var(--foreground)] tracking-tight font-sans">
            {value}
          </p>
          {subtext ? (
            <p className="text-[11px] text-[var(--muted-text)] mt-0.5 font-medium font-sans">
              {subtext}
            </p>
          ) : change ? (
            <p className={cn(
              "text-xs font-semibold mt-1",
              positive && "text-emerald-500",
              negative && "text-rose-500",
              !positive && !negative && "text-slate-400"
            )}>
              {change}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
