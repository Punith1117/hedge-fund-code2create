"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CostData {
  total_transaction_costs: number;
  total_slippage: number;
  total_costs: number;
  cost_as_percentage: number;
  trade_count: number;
  avg_cost_per_trade: number;
}

export default function CostAnalysis() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCostData();
  }, []);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8000/api/portfolio/cost-analysis");
      if (!response.ok) throw new Error("Failed to fetch cost analysis");
      const result = await response.json();
      setData(result.cost_analysis || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-48 flex items-center justify-center">Loading cost analysis...</div>;
  if (error) return <div className="h-48 flex items-center justify-center text-red-500">Error: {error}</div>;
  if (!data) return <div className="h-48 flex items-center justify-center">No cost data available</div>;

  const chartData = [
    { name: "Transaction Costs", value: data.total_transaction_costs },
    { name: "Slippage", value: data.total_slippage },
    { name: "Total Costs", value: data.total_costs },
  ];

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold mb-4">Transaction Cost Analysis</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Total Costs</p>
          <p className="text-xl font-bold text-red-600">${data.total_costs.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Cost % of Capital</p>
          <p className="text-xl font-bold text-orange-600">{data.cost_as_percentage.toFixed(2)}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Total Trades</p>
          <p className="text-xl font-bold text-blue-600">{data.trade_count}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Avg Cost/Trade</p>
          <p className="text-xl font-bold text-purple-600">${data.avg_cost_per_trade.toFixed(2)}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value.toFixed(0)}`} />
          <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, "Amount"]} />
          <Bar dataKey="value" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
