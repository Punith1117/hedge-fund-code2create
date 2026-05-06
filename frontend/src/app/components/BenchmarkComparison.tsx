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
  Area,
} from "recharts";

interface ComparisonData {
  timestamp: string;
  portfolio_value: number;
  portfolio_return: number;
  benchmark_return: number;
  alpha: number;
}

export default function BenchmarkComparison() {
  const [data, setData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComparisonData();
  }, []);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8000/api/portfolio/benchmark-comparison");
      if (!response.ok) throw new Error("Failed to fetch benchmark comparison");
      const result = await response.json();
      setData(result.comparison_data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center">Loading benchmark comparison...</div>;
  if (error) return <div className="h-64 flex items-center justify-center text-red-500">Error: {error}</div>;

  const chartData = data.map((d) => ({
    date: new Date(d.timestamp).toLocaleDateString(),
    portfolio: d.portfolio_return,
    benchmark: d.benchmark_return,
    alpha: d.alpha,
  }));

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold mb-4">Portfolio vs Benchmark (Equity)</h3>
      <ResponsiveContainer width="100%" height={300}>
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
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value.toFixed(0)}%`} />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: any, name: any) => [`${value.toFixed(2)}%`, name.charAt(0).toUpperCase() + name.slice(1)]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="portfolio"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Portfolio"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Benchmark"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
