"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ScoreHistory } from "@prisma/client";

export function ScoreChart({ history }: { history: ScoreHistory[] }) {
  const data = history.map((item) => ({
    score: item.score,
    date: new Date(item.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <div className="surface h-72 rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#888888" tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} stroke="#888888" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#111111", border: "1px solid #222222", borderRadius: 8 }}
            labelStyle={{ color: "#ffffff" }}
          />
          <Line type="monotone" dataKey="score" stroke="#00ff87" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
