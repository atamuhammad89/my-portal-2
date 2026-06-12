"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AgentPerformancePoint } from "@/types/dashboard";

type AgentPerformanceChartProps = {
  data: AgentPerformancePoint[];
};

export function AgentPerformanceChart({ data }: AgentPerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="agentName" stroke="var(--subtle-text)" fontSize={11} tickLine={false} />
        <YAxis domain={[0, 100]} stroke="var(--subtle-text)" fontSize={11} tickLine={false} />
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
        <Bar dataKey="successRate" fill="var(--brand-500)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
