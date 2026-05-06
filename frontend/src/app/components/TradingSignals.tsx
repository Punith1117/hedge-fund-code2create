"use client";

import { useEffect, useState } from "react";

interface TradingSignal {
  asset: string;
  signal_type: string;
  strength: number;
  price: number;
  timestamp: string;
  reason: string;
}

export default function TradingSignals() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("http://localhost:8000/api/strategy/signals");
      
      if (!response.ok) {
        throw new Error("Failed to fetch trading signals");
      }
      
      const data = await response.json();
      setSignals(data.signals);
      setLastUpdated(data.generated_at);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case "BUY":
        return "bg-green-100 text-green-800 border-green-200";
      case "SELL":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case "BUY":
        return "📈";
      case "SELL":
        return "📉";
      default:
        return "⏸️";
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.7) return "bg-green-500";
    if (strength >= 0.4) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading trading signals...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-64 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trading Signals</h1>
        <div className="flex gap-4 items-center">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Never"}
          </span>
          <button
            onClick={fetchSignals}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">No Trading Signals</h3>
          <p className="text-gray-600">
            There are currently no active trading signals. The market conditions may not meet the strategy criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signals.map((signal, index) => (
            <div
              key={index}
              className={`p-6 rounded-lg shadow-md border-2 ${getSignalColor(signal.signal_type)}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getSignalIcon(signal.signal_type)}</span>
                  <div>
                    <h3 className="text-lg font-bold">{signal.asset}</h3>
                    <p className="text-sm font-medium uppercase">{signal.signal_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Signal Strength</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStrengthColor(signal.strength)}`}
                        style={{ width: `${signal.strength * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {(signal.strength * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Price:</span>
                  <span className="font-bold">${signal.price.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Signal Time:</span>
                  <span className="text-sm">
                    {new Date(signal.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Reason:</p>
                  <p className="text-sm font-medium">{signal.reason}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Confidence: {signal.strength >= 0.7 ? "High" : signal.strength >= 0.4 ? "Medium" : "Low"}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    signal.signal_type === "BUY" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                  }`}>
                    {signal.signal_type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signal Summary */}
      {signals.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Signal Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {signals.filter(s => s.signal_type === "BUY").length}
              </p>
              <p className="text-sm text-gray-600">Buy Signals</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {signals.filter(s => s.signal_type === "SELL").length}
              </p>
              <p className="text-sm text-gray-600">Sell Signals</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {signals.length}
              </p>
              <p className="text-sm text-gray-600">Total Signals</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2">Average Signal Strength:</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{
                    width: `${(signals.reduce((sum, s) => sum + s.strength, 0) / signals.length) * 100}%`
                  }}
                />
              </div>
              <span className="text-sm font-medium">
                {((signals.reduce((sum, s) => sum + s.strength, 0) / signals.length) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
