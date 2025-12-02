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
  BarChart,
  Bar,
  Cell,
  LabelList,
} from "recharts";

type Props = {
  data: any[];
  variant?: "rating" | "sentiment";
};

export default function RatingChart({ data, variant = "rating" }: Props) {
  const isSentiment = variant === "sentiment";
  const labelMap: Record<string, string> = {
    positive: "긍정",
    negative: "부정",
    neutral: "중립",
    irrelevant: "기타",
  };

  return (
    <div className="w-full h-60">
      <ResponsiveContainer width="100%" height="100%">
        {isSentiment ? (
          (() => {
            const totals = data.reduce(
              (acc, cur) => {
                acc.positive += cur.positive || 0;
                acc.negative += cur.negative || 0;
                acc.neutral += cur.neutral || 0;
                acc.irrelevant += cur.irrelevant || 0;
                return acc;
              },
              { positive: 0, negative: 0, neutral: 0, irrelevant: 0 }
            );
            const chartData = [
              { key: "positive", name: "긍정", value: totals.positive, color: "#22c55e" },
              { key: "neutral", name: "중립", value: totals.neutral, color: "#38bdf8" },
              { key: "negative", name: "부정", value: totals.negative, color: "#ef4444" },
              { key: "irrelevant", name: "기타", value: totals.irrelevant, color: "#a3a3a3" },
            ];
            return (
              <BarChart data={chartData} barSize={32}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v: any, n: any) => [v, n]} />
                <Legend />
                <Bar dataKey="value" name="건수">
                  <LabelList dataKey="value" position="top" />
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            );
          })()
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
  );
}
