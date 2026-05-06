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
  BarChart,
  Bar,
} from "recharts";

interface RiskData {
  var_95: number;
  var_99: number;
  volatility: number;
  max_drawdown: number;
  current_drawdown: number;
  sharpe_ratio: number;
  beta: number;
  alpha: number;
}

interface RiskLimits {
  max_portfolio_risk: number;
  max_position_size: number;
  stop_loss_threshold: number;
  risk_free_rate: number;
}

interface RiskResponse {
  risk_metrics: RiskData;
  risk_limits: RiskLimits;
  position_violations: string[];
  risk_level: string;
  updated_at: string;
}

export default function RiskMetricsComponent() {
  const [riskData, setRiskData] = useState<RiskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRiskMetrics();
  }, []);

  const fetchRiskMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("http://localhost:8000/api/risk/metrics");
      
      if (!response.ok) {
        throw new Error("Failed to fetch risk metrics");
      }
      
      const data = await response.json();
      
      // Check if API returned an error
      if (data.error) {
        throw new Error(data.error);
      }
      
      setRiskData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case "LOW":
        return "🟢";
      case "MEDIUM":
        return "🟡";
      case "HIGH":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getSharpeRatioColor = (ratio: number) => {
    if (ratio >= 1.5) return "text-green-600";
    if (ratio >= 1.0) return "text-yellow-600";
    return "text-red-600";
  };

  const getDrawdownColor = (drawdown: number) => {
    if (drawdown >= -0.05) return "text-green-600";
    if (drawdown >= -0.15) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading risk metrics...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-64 text-red-500">Error: {error}</div>;
  }

  if (!riskData) {
    return <div className="flex items-center justify-center h-64">No risk data available</div>;
  }

  // Prepare data for VaR chart
  const varData = [
    { name: "VaR 95%", value: Math.abs(riskData.risk_metrics?.var_95 || 0) * 100, fill: "#3b82f6" },
    { name: "VaR 99%", value: Math.abs(riskData.risk_metrics?.var_99 || 0) * 100, fill: "#ef4444" },
  ];

  // Prepare data for risk metrics comparison
  const riskComparisonData = [
    { metric: "Volatility", value: (riskData.risk_metrics?.volatility || 0) * 100, benchmark: 15 },
    { metric: "Max Drawdown", value: Math.abs(riskData.risk_metrics?.max_drawdown || 0) * 100, benchmark: 15 },
    { metric: "Current Drawdown", value: Math.abs(riskData.risk_metrics?.current_drawdown || 0) * 100, benchmark: 10 },
  ];

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Risk Metrics</h1>
        <div className="flex gap-4 items-center">
          <span className={`px-3 py-1 rounded-full border-2 font-medium ${getRiskLevelColor(riskData.risk_level)}`}>
            {getRiskLevelIcon(riskData.risk_level)} {riskData.risk_level} RISK
          </span>
          <button
            onClick={fetchRiskMetrics}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Risk Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Sharpe Ratio</h3>
          <p className={`text-2xl font-bold ${getSharpeRatioColor(riskData.risk_metrics?.sharpe_ratio || 0)}`}>
            {(riskData.risk_metrics?.sharpe_ratio || 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-600">
            {(riskData.risk_metrics?.sharpe_ratio || 0) >= 1.5 ? "Excellent" : 
             (riskData.risk_metrics?.sharpe_ratio || 0) >= 1.0 ? "Good" : "Poor"}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Volatility</h3>
          <p className="text-2xl font-bold text-blue-600">
            {((riskData.risk_metrics?.volatility || 0) * 100).toFixed(2)}%
          </p>
          <p className="text-sm text-gray-600">
            Annualized
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Max Drawdown</h3>
          <p className={`text-2xl font-bold ${getDrawdownColor(riskData.risk_metrics?.max_drawdown || 0)}`}>
            {((riskData.risk_metrics?.max_drawdown || 0) * 100).toFixed(2)}%
          </p>
          <p className="text-sm text-gray-600">
            Historical worst
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Current Drawdown</h3>
          <p className={`text-2xl font-bold ${getDrawdownColor(riskData.risk_metrics?.current_drawdown || 0)}`}>
            {((riskData.risk_metrics?.current_drawdown || 0) * 100).toFixed(2)}%
          </p>
          <p className="text-sm text-gray-600">
            From peak
          </p>
        </div>
      </div>

      {/* Risk Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Value at Risk Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Value at Risk (VaR)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={varData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: any) => [`${value.toFixed(2)}%`, "Daily Loss Risk"]}
              />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>• VaR 95%: {(Math.abs(riskData.risk_metrics?.var_95 || 0) * 100).toFixed(2)}% daily loss risk</p>
              <p>• VaR 99%: {(Math.abs(riskData.risk_metrics?.var_99 || 0) * 100).toFixed(2)}% daily loss risk</p>
            </div>
          </div>
        </div>

        {/* Risk Comparison Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Risk vs Benchmarks</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: any, name: any) => [
                  `${value.toFixed(2)}%`,
                  name === "value" ? "Current" : "Benchmark"
                ]}
              />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" name="Current" />
              <Bar dataKey="benchmark" fill="#10b981" name="Benchmark" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Limits and Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Limits */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Risk Limits</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Max Position Size:</span>
              <span className="font-bold">
                {((riskData.risk_limits?.max_position_size || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Stop Loss Threshold:</span>
              <span className="font-bold">
                {((riskData.risk_limits?.stop_loss_threshold || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Max Portfolio Risk:</span>
              <span className="font-bold">
                {((riskData.risk_limits?.max_portfolio_risk || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Risk-Free Rate:</span>
              <span className="font-bold">
                {((riskData.risk_limits?.risk_free_rate || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Position Violations */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Position Violations</h2>
          {(!riskData.position_violations || riskData.position_violations.length === 0) ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-green-600 font-medium">No Position Violations</p>
              <p className="text-sm text-gray-600 mt-2">
                All positions are within risk limits
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {riskData.position_violations.map((violation, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ {violation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Additional Risk Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Beta</h3>
            <p className="text-2xl font-bold text-blue-600">
              {(riskData.risk_metrics?.beta || 0).toFixed(3)}
            </p>
            <p className="text-sm text-gray-600">
              Market sensitivity
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Alpha</h3>
            <p className={`text-2xl font-bold ${(riskData.risk_metrics?.alpha || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {((riskData.risk_metrics?.alpha || 0) * 100).toFixed(2)}%
            </p>
            <p className="text-sm text-gray-600">
              Annualized excess return
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Risk-Adjusted Return</h3>
            <p className={`text-2xl font-bold ${(riskData.risk_metrics?.sharpe_ratio || 0) >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
              {(riskData.risk_metrics?.sharpe_ratio || 0) >= 1.0 ? "GOOD" : "POOR"}
            </p>
            <p className="text-sm text-gray-600">
              Based on Sharpe ratio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
