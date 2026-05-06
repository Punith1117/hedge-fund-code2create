"use client";

import { useEffect, useState } from "react";

interface CorrelationData {
  correlation_matrix: Record<string, Record<string, number>>;
  assets: string[];
}

export default function CorrelationMatrix() {
  const [data, setData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCorrelationData();
  }, []);

  const fetchCorrelationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8000/api/metrics/correlation-matrix");
      if (!response.ok) throw new Error("Failed to fetch correlation matrix");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getColorForCorrelation = (value: number) => {
    const intensity = Math.abs(value);
    if (value > 0) {
      return `rgba(16, 185, 129, ${intensity})`;
    } else {
      return `rgba(239, 68, 68, ${intensity})`;
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center">Loading correlation matrix...</div>;
  if (error) return <div className="h-64 flex items-center justify-center text-red-500">Error: {error}</div>;
  if (!data || !data.assets) return <div className="h-64 flex items-center justify-center">No data available</div>;

  const assets = data.assets;
  const matrix = data.correlation_matrix;

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold mb-4">Asset Correlation Matrix</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-2 px-4"></th>
              {assets.map((asset) => (
                <th key={asset} className="py-2 px-4 text-sm font-medium text-gray-600">
                  {asset}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset1) => (
              <tr key={asset1}>
                <td className="py-2 px-4 font-medium text-sm">{asset1}</td>
                {assets.map((asset2) => {
                  const value = matrix[asset1]?.[asset2] ?? 0;
                  return (
                    <td
                      key={asset2}
                      className="py-2 px-4 text-center text-sm font-bold"
                      style={{ backgroundColor: getColorForCorrelation(value) }}
                    >
                      {value.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500"></div> Positive
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500"></div> Negative
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-200"></div> Neutral
        </span>
      </div>
    </div>
  );
}
