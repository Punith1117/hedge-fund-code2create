"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RollingMetric {
  timestamp: string;
  rolling_sharpe: number;
  rolling_volatility: number;
}

export default function RollingMetricsChart() {
  const [data, setData] = useState<RollingMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRollingMetrics();
  }, []);

  const fetchRollingMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8000/api/portfolio/rolling-metrics?window=30");
      if (!response.ok) throw new Error("Failed to fetch rolling metrics");
      const result = await response.json();
      setData(result.rolling_metrics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center">Loading rolling metrics...</div>;
  if (error) return <div className="h-64 flex items-center justify-center text-red-500">Error: {error}</div>;

  const chartData = data.map((d) => ({
    date: new Date(d.timestamp).toLocaleDateString(),
    sharpe: d.rolling_sharpe,
    volatility: d.rolling_volatility * 100,
  }));

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold mb-4">Rolling Metrics (30-day window)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }}
          />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} label={{ value: "Sharpe", angle: -90, position: "insideLeft" }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} label={{ value: "Vol %", angle: -90, position: "insideRight" }} />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: any, name: any) => [
              name === "sharpe" ? value.toFixed(2) : `${value.toFixed(1)}%`,
              name === "sharpe" ? "Sharpe Ratio" : "Volatility"
            ]}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="sharpe"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Sharpe Ratio"
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="volatility"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Volatility (%)"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
