"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { TrendPoint } from "@/types/dashboard";

type CallTrendsChartProps = {
  data: TrendPoint[];
};

export function CallTrendsChart({ data }: CallTrendsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" stroke="var(--subtle-text)" fontSize={11} tickLine={false} />
        <YAxis stroke="var(--subtle-text)" fontSize={11} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "12px",
            boxShadow: "var(--shadow-md)"
          }}
        />
        <Line type="monotone" dataKey="totalCalls" stroke="var(--brand-200)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="answeredCalls" stroke="var(--brand-500)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
