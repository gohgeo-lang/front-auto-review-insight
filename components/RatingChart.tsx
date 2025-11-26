"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";

type Props = {
  data: any[];
  variant?: "rating" | "sentiment";
};

export default function RatingChart({ data, variant = "rating" }: Props) {
  const isSentiment = variant === "sentiment";

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
      <h2 className="text-lg font-semibold mb-2">
        {isSentiment ? "긍정/부정 추이" : "최근 평점 변화"}
      </h2>

      <div className="w-full h-60">
        <ResponsiveContainer width="100%" height="100%">
          {isSentiment ? (
            <AreaChart data={data}>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="positive"
                stackId="1"
                stroke="#22c55e"
                fill="#bbf7d0"
              />
              <Area
                type="monotone"
                dataKey="negative"
                stackId="1"
                stroke="#ef4444"
                fill="#fecdd3"
              />
              <Area
                type="monotone"
                dataKey="irrelevant"
                stackId="1"
                stroke="#a3a3a3"
                fill="#e5e5e5"
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
