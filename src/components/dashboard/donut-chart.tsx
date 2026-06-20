"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type DonutSlice = {
  name: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  data: DonutSlice[];
  total: number;
  totalLabel?: string;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0];
    return (
      <div
        className="rounded-xl px-3 py-2 text-xs font-semibold"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
        }}
      >
        {d.name}: <span style={{ color: d.payload.color }}>{d.value}</span>
      </div>
    );
  }
  return null;
};

export function DonutChart({ data, total, totalLabel = "Total Calls" }: DonutChartProps) {
  const pct = (v: number) =>
    total > 0 ? `${Math.round((v / total) * 100)}%` : "0%";

  return (
    <div className="flex flex-col h-full">
      {/* Chart + center label */}
      <div className="relative flex-1 min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="80%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-3xl font-extrabold leading-none"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--foreground)" }}
          >
            {total}
          </span>
          <span className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--muted-text)" }}>
            {totalLabel}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-col gap-1.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: d.color }}
              />
              <span style={{ color: "var(--muted-text)" }}>{d.name}</span>
            </div>
            <span className="font-bold" style={{ color: "var(--foreground)" }}>
              {d.value}{" "}
              <span style={{ color: "var(--muted-text)", fontWeight: 400 }}>
                ({pct(d.value)})
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
