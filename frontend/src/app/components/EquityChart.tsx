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

interface EquityData {
  Date: string;
  Price: number | null;
  SMA_20: number | null;
  SMA_50: number | null;
  SMA_200: number | null;
}

export default function EquityChart() {
  const [data, setData] = useState<EquityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showSMA200, setShowSMA200] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [allData, setAllData] = useState<EquityData[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("http://localhost:8000/api/equity?limit=10000");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        // Store all data and set initial date range
        const allFetchedData = result.data;
        setAllData(allFetchedData);
        
        // Set initial date range to show last 500 data points
        const startIndex = Math.max(0, allFetchedData.length - 500);
        const displayData = allFetchedData.slice(startIndex);
        
        // Set date range inputs
        if (allFetchedData.length > 0) {
          setStartDate(allFetchedData[startIndex].Date);
          setEndDate(allFetchedData[allFetchedData.length - 1].Date);
        }
        
        setData(displayData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter data based on date range
  useEffect(() => {
    if (allData.length === 0 || !startDate || !endDate) return;
    
    const startIndex = allData.findIndex(row => row.Date >= startDate);
    const endIndex = allData.findIndex(row => row.Date > endDate);
    
    if (startIndex !== -1) {
      const filteredData = endIndex !== -1 
        ? allData.slice(startIndex, endIndex)
        : allData.slice(startIndex);
      setData(filteredData);
    }
  }, [startDate, endDate, allData]);

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading chart data...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-96 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="w-full p-6">
      <h1 className="text-2xl font-bold mb-6">Equity Price with SMA Indicators</h1>
      
      {/* Controls */}
      <div className="space-y-4 mb-6">
        {/* Date Range Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1 border rounded-md"
              min={allData[0]?.Date}
              max={allData[allData.length - 1]?.Date}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1 border rounded-md"
              min={allData[0]?.Date}
              max={allData[allData.length - 1]?.Date}
            />
          </div>
          <button
            onClick={() => {
              if (allData.length > 0) {
                setStartDate(allData[0].Date);
                setEndDate(allData[allData.length - 1].Date);
              }
            }}
            className="px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Show All
          </button>
          <button
            onClick={() => {
              if (allData.length > 0) {
                const startIndex = Math.max(0, allData.length - 500);
                setStartDate(allData[startIndex].Date);
                setEndDate(allData[allData.length - 1].Date);
              }
            }}
            className="px-4 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Last 500
          </button>
        </div>
        
        {/* SMA Toggle Controls */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSMA20}
              onChange={(e) => setShowSMA20(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-green-600">SMA 20</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSMA50}
              onChange={(e) => setShowSMA50(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-amber-600">SMA 50</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSMA200}
              onChange={(e) => setShowSMA200(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-red-600">SMA 200</span>
          </label>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="Date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: any) => {
              if (value === null || value === undefined) return "N/A";
              const numValue = typeof value === "string" ? parseFloat(value) : value;
              if (isNaN(numValue)) return "N/A";
              return numValue.toFixed(2);
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Price"
            stroke="#2563eb"
            strokeWidth={2}
            name="Price"
            dot={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="SMA_20"
            stroke="#10b981"
            strokeWidth={3}
            name="SMA 20"
            dot={false}
            connectNulls={false}
            hide={!showSMA20}
          />
          <Line
            type="monotone"
            dataKey="SMA_50"
            stroke="#f59e0b"
            strokeWidth={3}
            name="SMA 50"
            dot={false}
            connectNulls={false}
            hide={!showSMA50}
          />
          <Line
            type="monotone"
            dataKey="SMA_200"
            stroke="#ef4444"
            strokeWidth={3}
            name="SMA 200"
            dot={false}
            connectNulls={false}
            hide={!showSMA200}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
