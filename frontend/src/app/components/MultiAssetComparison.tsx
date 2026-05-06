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

interface PerformanceData {
  timestamp: string;
  equity_return: number;
  oil_return: number;
  gold_return: number;
  bonds_return: number;
}

export default function MultiAssetComparison() {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleAssets, setVisibleAssets] = useState({
    equity: true,
    oil: true,
    gold: true,
    bonds: true,
  });

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8000/api/multi-asset/performance");
      if (!response.ok) throw new Error("Failed to fetch multi-asset performance");
      const result = await response.json();
      setData(result.performance_data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center">Loading multi-asset performance...</div>;
  if (error) return <div className="h-64 flex items-center justify-center text-red-500">Error: {error}</div>;

  const chartData = data.map((d) => ({
    date: new Date(d.timestamp).toLocaleDateString(),
    equity: d.equity_return,
    oil: d.oil_return,
    gold: d.gold_return,
    bonds: d.bonds_return,
  }));

  const COLORS = {
    equity: "#3b82f6",
    oil: "#f59e0b",
    gold: "#eab308",
    bonds: "#10b981",
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Multi-Asset Performance Comparison</h3>
        <div className="flex gap-2">
          {Object.entries(visibleAssets).map(([asset, visible]) => (
            <button
              key={asset}
              onClick={() => setVisibleAssets((prev) => ({ ...prev, [asset]: !prev[asset as keyof typeof prev] }))}
              className={`px-2 py-1 text-xs rounded ${visible ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-500"}`}
              style={{ borderLeft: visible ? `3px solid ${COLORS[asset as keyof typeof COLORS]}` : undefined }}
            >
              {asset.charAt(0).toUpperCase() + asset.slice(1)}
            </button>
          ))}
        </div>
      </div>
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
          {visibleAssets.equity && <Line type="monotone" dataKey="equity" stroke={COLORS.equity} strokeWidth={2} name="Equity" dot={false} />}
          {visibleAssets.oil && <Line type="monotone" dataKey="oil" stroke={COLORS.oil} strokeWidth={2} name="Oil" dot={false} />}
          {visibleAssets.gold && <Line type="monotone" dataKey="gold" stroke={COLORS.gold} strokeWidth={2} name="Gold" dot={false} />}
          {visibleAssets.bonds && <Line type="monotone" dataKey="bonds" stroke={COLORS.bonds} strokeWidth={2} name="Bonds" dot={false} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
