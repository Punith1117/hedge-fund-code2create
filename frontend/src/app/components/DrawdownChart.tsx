"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DrawdownData {
  timestamp: string;
  drawdown: number;
  peak_value: number;
  total_value: number;
}

export default function DrawdownChart() {
  const [data, setData] = useState<DrawdownData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDrawdownData();
  }, []);

  const fetchDrawdownData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8000/api/portfolio/drawdown-history");
      if (!response.ok) throw new Error("Failed to fetch drawdown data");
      const result = await response.json();
      setData(result.drawdown_history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center">Loading drawdown chart...</div>;
  if (error) return <div className="h-64 flex items-center justify-center text-red-500">Error: {error}</div>;

  const chartData = data.map((d) => ({
    date: new Date(d.timestamp).toLocaleDateString(),
    drawdown: d.drawdown * 100,
  }));

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold mb-4">Drawdown Analysis</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
          />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: any) => [`${value.toFixed(2)}%`, "Drawdown"]}
          />
          <defs>
            <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="drawdown"
            stroke="#ef4444"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#drawdownGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
