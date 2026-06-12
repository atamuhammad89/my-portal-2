import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  change?: string;
};

// Cycle through accent color schemes per card
const accents = [
  { icon: "bg-indigo-100 text-indigo-600",   bar: "from-indigo-400 to-violet-400" },
  { icon: "bg-emerald-100 text-emerald-600", bar: "from-emerald-400 to-teal-400" },
  { icon: "bg-rose-100 text-rose-600",       bar: "from-rose-400 to-pink-400" },
  { icon: "bg-amber-100 text-amber-600",     bar: "from-amber-400 to-orange-400" },
  { icon: "bg-cyan-100 text-cyan-600",       bar: "from-cyan-400 to-sky-400" },
];

export function StatCard({ label, value, change }: StatCardProps) {
  const positive = change?.startsWith("+");
  const negative = change?.startsWith("-");

  return (
    <article
      className="rounded-xl px-5 pt-5 pb-4 flex flex-col gap-1 relative overflow-hidden transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[0_0_15px_rgba(0,240,255,0.07)]"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--brand-500)"
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--subtle-text)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-bold mt-1 text-white"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {value}
      </p>
      {change ? (
        <p className={cn(
          "text-xs font-semibold mt-1",
          positive && "text-emerald-400",
          negative && "text-rose-400",
          !positive && !negative && "text-slate-400"
        )}>
          {change}
        </p>
      ) : null}
    </article>
  );
}
