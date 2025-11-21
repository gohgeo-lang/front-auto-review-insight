"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RatingChart({ data }: any) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
      <h2 className="text-lg font-semibold mb-2">최근 7일 평점 변화</h2>

      <div className="w-full h-60">
        <ResponsiveContainer width="100%" height="100%">
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
        </ResponsiveContainer>
      </div>
    </div>
  );
}
