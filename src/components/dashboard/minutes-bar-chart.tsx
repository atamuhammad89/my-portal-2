"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

type MinutesBarChartProps = {
  data: { date: string; minutes: number }[];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div
        className="rounded-xl px-3 py-2 text-xs font-semibold"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
        }}
      >
        <p style={{ color: "var(--muted-text)" }} className="mb-0.5">{label}</p>
        <p>
          Minutes:{" "}
          <span style={{ color: "#3b82f6" }}>{payload[0].value.toFixed(1)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function MinutesBarChart({ data }: MinutesBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="var(--subtle-text)"
          fontSize={10}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--subtle-text)"
          fontSize={10}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.08)" }} />
        <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]}>
          <LabelList
            dataKey="minutes"
            position="top"
            style={{ fill: "var(--muted-text)", fontSize: 9, fontWeight: 600 }}
            formatter={(v: number) => (v > 0 ? v.toFixed(1) : "")}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
