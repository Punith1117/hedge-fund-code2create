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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import DrawdownChart from "./DrawdownChart";
import RollingMetricsChart from "./RollingMetricsChart";
import MultiAssetComparison from "./MultiAssetComparison";
import BenchmarkComparison from "./BenchmarkComparison";
import CorrelationMatrix from "./CorrelationMatrix";
import CostAnalysis from "./CostAnalysis";

interface PortfolioMetrics {
  total_value: number;
  total_return: number;
  daily_return: number;
  total_trades: number;
  win_rate: number;
  initial_capital: number;
}

interface RiskMetrics {
  var_95: number;
  var_99: number;
  volatility: number;
  max_drawdown: number;
  current_drawdown: number;
  sharpe_ratio: number;
  beta: number;
  alpha: number;
}

interface Position {
  quantity: number;
  entry_price: number;
  current_price: number;
  entry_date: string;
  unrealized_pnl: number;
  realized_pnl: number;
  market_value: number;
}

interface PortfolioData {
  total_value: number;
  cash: number;
  positions: Record<string, Position>;
  allocation: Record<string, number>;
  positions_count: number;
}

interface Trade {
  timestamp: string;
  asset: string;
  action: string;
  quantity: number;
  price: number;
  value: number;
  transaction_cost: number;
  pnl: number;
}

interface HistoryPoint {
  timestamp: string;
  total_value: number;
  cash: number;
  daily_return: number;
  cumulative_return: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PortfolioMetrics | null>(null);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [macroData, setMacroData] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [portfolioRes, performanceRes, tradesRes, macroRes] = await Promise.all([
        fetch("http://localhost:8000/api/portfolio/current"),
        fetch("http://localhost:8000/api/portfolio/performance"),
        fetch("http://localhost:8000/api/portfolio/trades?limit=50"),
        fetch("http://localhost:8000/api/macro?limit=1"),
      ]);

      if (!portfolioRes.ok || !performanceRes.ok || !tradesRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const portfolio = await portfolioRes.json();
      const performance = await performanceRes.json();
      const tradesData = await tradesRes.json();
      const macroResult = await macroRes.json();

      setPortfolioData(portfolio);
      setPerformanceMetrics(performance.performance_metrics);
      setRiskMetrics(performance.risk_metrics);
      setTrades(tradesData.trades);
      setHistory(performance.history || []);
      setMacroData(macroResult.data || []);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const executeStrategy = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/strategy/execute", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to execute strategy");
      }
      
      const result = await response.json();
      console.log("Strategy executed:", result);
      
      // Refresh dashboard data after execution
      fetchDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute strategy");
    }
  };

  const resetPortfolio = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/portfolio/reset", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to reset portfolio");
      }
      
      // Refresh dashboard data after reset
      fetchDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset portfolio");
    }
  };

  const exportData = () => {
    if (!history.length) return;
    
    const csvContent = [
      "Date,Portfolio Value,Cash,Daily Return,Cumulative Return",
      ...history.map(h => 
        `${h.timestamp},${h.total_value},${h.cash},${h.daily_return},${h.cumulative_return}`
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-96 text-red-500">Error: {error}</div>;
  }

  // Prepare allocation data for pie chart
  const allocationData = portfolioData?.allocation 
    ? Object.entries(portfolioData.allocation).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  // Prepare performance history data
  const chartData = history.map(point => ({
    date: new Date(point.timestamp).toLocaleDateString(),
    value: point.total_value,
    return: point.cumulative_return * 100,
  }));

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hedge Fund Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Last updated: {lastUpdated}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Refresh
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Export Data
          </button>
          <button
            onClick={executeStrategy}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Execute Strategy
          </button>
          <button
            onClick={resetPortfolio}
            className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Reset Portfolio
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Portfolio Value</h3>
          <p className="text-2xl font-bold text-blue-600">
            ${portfolioData?.total_value?.toLocaleString() || "0"}
          </p>
          <p className="text-sm text-gray-600">
            {performanceMetrics?.total_return ? 
              `${(performanceMetrics.total_return * 100).toFixed(2)}% total return` : 
              "No data"
            }
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Daily Return</h3>
          <p className="text-2xl font-bold text-green-600">
            {performanceMetrics?.daily_return ? 
              `${(performanceMetrics.daily_return * 100).toFixed(2)}%` : 
              "0.00%"
            }
          </p>
          <p className="text-sm text-gray-600">
            Cash: ${portfolioData?.cash?.toLocaleString() || "0"}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Sharpe Ratio</h3>
          <p className="text-2xl font-bold text-purple-600">
            {riskMetrics?.sharpe_ratio?.toFixed(2) || "0.00"}
          </p>
          <p className="text-sm text-gray-600">
            Volatility: {riskMetrics?.volatility ? 
              `${(riskMetrics.volatility * 100).toFixed(2)}%` : 
              "0.00%"
            }
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Max Drawdown</h3>
          <p className="text-2xl font-bold text-red-600">
            {riskMetrics?.max_drawdown ? 
              `${(riskMetrics.max_drawdown * 100).toFixed(2)}%` : 
              "0.00%"
            }
          </p>
          <p className="text-sm text-gray-600">
            Win Rate: {performanceMetrics?.win_rate ? 
              `${(performanceMetrics.win_rate * 100).toFixed(1)}%` : 
              "0.0%"
            }
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Beta</h3>
          <p className="text-2xl font-bold text-indigo-600">
            {riskMetrics?.beta?.toFixed(2) || "0.00"}
          </p>
          <p className="text-sm text-gray-600">
            Market Sensitivity
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Alpha</h3>
          <p className={`text-2xl font-bold ${(riskMetrics?.alpha || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {riskMetrics?.alpha ? 
              `${(riskMetrics.alpha * 100).toFixed(2)}%` : 
              "0.00%"
            }
          </p>
          <p className="text-sm text-gray-600">
            Excess Return vs Benchmark
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">VaR (95%)</h3>
          <p className="text-2xl font-bold text-orange-600">
            {riskMetrics?.var_95 ? 
              `${(Math.abs(riskMetrics.var_95) * 100).toFixed(2)}%` : 
              "0.00%"
            }
          </p>
          <p className="text-sm text-gray-600">
            Daily Loss Risk
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Annualized Return</h3>
          <p className="text-2xl font-bold text-teal-600">
            {performanceMetrics?.total_return && history.length > 252 ? 
              `${(performanceMetrics.total_return * 252 / history.length * 100).toFixed(2)}%` : 
              "0.00%"
            }
          </p>
          <p className="text-sm text-gray-600">
            Trades: {performanceMetrics?.total_trades || 0}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Portfolio Performance</h2>
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
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any, name: any) => [
                  name === "value" ? `$${value.toLocaleString()}` : `${value.toFixed(2)}%`,
                  name === "value" ? "Portfolio Value" : "Return %"
                ]}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Portfolio Value"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="return"
                stroke="#10b981"
                strokeWidth={2}
                name="Return %"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Allocation Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Asset Allocation</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `$${(value || 0).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drawdown & Rolling Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <DrawdownChart />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <RollingMetricsChart />
        </div>
      </div>

      {/* Multi-Asset Performance & Benchmark Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <MultiAssetComparison />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <BenchmarkComparison />
        </div>
      </div>

      {/* Cost Analysis & Correlation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <CostAnalysis />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <CorrelationMatrix />
        </div>
      </div>

      {/* Macro Indicators */}
      {macroData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Current Macro Environment</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {macroData.map((macro, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Inflation</span>
                  <span className="font-bold">{macro.Inflation?.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Interest Rate</span>
                  <span className="font-bold">{macro.Interest_Rate?.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">USD Index</span>
                  <span className="font-bold">{macro.USD_Index?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sentiment</span>
                  <span className={`font-bold ${macro.Sentiment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {macro.Sentiment?.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positions and Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Positions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Current Positions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Asset</th>
                  <th className="text-right py-2">Quantity</th>
                  <th className="text-right py-2">P&L</th>
                  <th className="text-right py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData?.positions && Object.entries(portfolioData.positions).map(([asset, position]) => (
                  <tr key={asset} className="border-b">
                    <td className="py-2 font-medium">{asset}</td>
                    <td className="text-right py-2">{position.quantity.toFixed(2)}</td>
                    <td className={`text-right py-2 ${position.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${position.unrealized_pnl.toFixed(2)}
                    </td>
                    <td className="text-right py-2">${position.market_value.toFixed(2)}</td>
                  </tr>
                ))}
                {(!portfolioData?.positions || Object.keys(portfolioData.positions).length === 0) && (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">
                      No current positions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Recent Trades</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Asset</th>
                  <th className="text-left py-2">Action</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">P&L</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 10).map((trade, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 text-sm">
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2">{trade.asset}</td>
                    <td className={`py-2 font-medium ${
                      trade.action === 'BUY' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trade.action}
                    </td>
                    <td className="text-right py-2">${trade.price.toFixed(2)}</td>
                    <td className={`text-right py-2 ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trade.pnl ? `$${trade.pnl.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
                {trades.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">
                      No trades executed yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
