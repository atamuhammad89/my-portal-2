import { cn } from "@/lib/utils";

export type StatusVariant = "success" | "warning" | "danger" | "neutral";

type StatusBadgeProps = {
  text: string;
  variant?: StatusVariant;
};

const variantStyles: Record<StatusVariant, { bg: string; color: string; dot: string; border: string }> = {
  success: { bg: "rgba(16, 185, 129, 0.08)", color: "#34d399", dot: "#10b981", border: "rgba(16, 185, 129, 0.2)" },
  warning: { bg: "rgba(245, 158, 11, 0.08)", color: "#fbbf24", dot: "#f59e0b", border: "rgba(245, 158, 11, 0.2)" },
  danger:  { bg: "rgba(244, 63, 94, 0.08)", color: "#fb7185", dot: "#f43f5e", border: "rgba(244, 63, 94, 0.2)" },
  neutral: { bg: "rgba(0, 240, 255, 0.05)", color: "#00f0ff", dot: "#00f0ff", border: "rgba(0, 240, 255, 0.15)" },
};

export function StatusBadge({ text, variant = "neutral" }: StatusBadgeProps) {
  const s = variantStyles[variant];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}` }} />
      {text}
    </span>
  );
}
