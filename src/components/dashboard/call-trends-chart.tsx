"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Dot,
} from "recharts";

type TrendPoint = {
  date: string;
  totalCalls: number;
  answeredCalls?: number;
  missedCalls?: number;
  totalMinutes?: number;
};

type CallTrendsChartProps = {
  data: TrendPoint[];
  showMinutes?: boolean;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div
        className="rounded-xl px-3 py-2.5 text-xs font-semibold space-y-1"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <p style={{ color: "var(--muted-text)" }} className="mb-1 font-bold">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => (
  <div className="flex items-center gap-4 justify-center mt-2">
    {payload?.map((entry: any) => (
      <div key={entry.value} className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
        <span className="text-[10px] font-semibold" style={{ color: "var(--muted-text)" }}>
          {entry.value}
        </span>
      </div>
    ))}
  </div>
);

export function CallTrendsChart({ data, showMinutes = true }: CallTrendsChartProps) {
  const hasMinutes = showMinutes && data.some((d) => (d.totalMinutes ?? 0) > 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: hasMinutes ? 32 : 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="var(--subtle-text)"
          fontSize={10}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="calls"
          orientation={hasMinutes ? "right" : "left"}
          stroke="var(--subtle-text)"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          width={30}
        />
        {hasMinutes && (
          <YAxis
            yAxisId="minutes"
            orientation="left"
            stroke="var(--subtle-text)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={30}
          />
        )}
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />

        {hasMinutes && (
          <Line
            yAxisId="minutes"
            type="monotone"
            dataKey="totalMinutes"
            name="Total Minutes Used"
            stroke="#00f0ff"
            strokeWidth={2}
            dot={<Dot r={3} fill="#00f0ff" stroke="#00f0ff" strokeWidth={1} />}
            activeDot={{ r: 5, fill: "#00f0ff" }}
          />
        )}
        <Line
          yAxisId="calls"
          type="monotone"
          dataKey="totalCalls"
          name="Total Calls"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={<Dot r={3} fill="#3b82f6" stroke="#3b82f6" strokeWidth={1} />}
          activeDot={{ r: 5, fill: "#3b82f6" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
