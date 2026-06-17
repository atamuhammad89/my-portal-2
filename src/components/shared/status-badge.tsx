import { cn } from "@/lib/utils";

export type StatusVariant = "success" | "warning" | "danger" | "neutral";

type StatusBadgeProps = {
  text: string;
  variant?: StatusVariant;
};

const variantStyles: Record<StatusVariant, { bg: string; color: string; dot: string; border: string }> = {
  success: { bg: "var(--success-bg)", color: "var(--success-fg)", dot: "var(--success-fg)", border: "rgba(16, 185, 129, 0.25)" },
  warning: { bg: "var(--warning-bg)", color: "var(--warning-fg)", dot: "var(--warning-fg)", border: "rgba(245, 158, 11, 0.25)" },
  danger:  { bg: "var(--danger-bg)", color: "var(--danger-fg)", dot: "var(--danger-fg)", border: "rgba(244, 63, 94, 0.25)" },
  neutral: { bg: "var(--brand-100)", color: "var(--brand-500)", dot: "var(--brand-500)", border: "var(--brand-200)" },
};

export function StatusBadge({ text, variant = "neutral" }: StatusBadgeProps) {
  const s = variantStyles[variant];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all duration-200"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full inline-block animate-pulse" style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}` }} />
      {text}
    </span>
  );
}
