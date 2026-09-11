"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function UsageChart({
  data,
}: {
  data: { day: string; taka: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#ffffff10" vertical={false} />
        <XAxis
          dataKey="day"
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "1px solid #ffffff20",
            borderRadius: 8,
            color: "#fff",
          }}
          formatter={(value) => [`৳${Number(value ?? 0).toFixed(2)}`, "খরচ"]}
        />
        <Area
          type="monotone"
          dataKey="taka"
          stroke="#34d399"
          strokeWidth={2}
          fill="url(#spend)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
