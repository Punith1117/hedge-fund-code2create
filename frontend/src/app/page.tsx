"use client";

import { useState } from "react";
import EquityChart from "./components/EquityChart";
import Dashboard from "./components/Dashboard";
import TradingSignals from "./components/TradingSignals";
import RiskMetricsComponent from "./components/RiskMetrics";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard", component: <Dashboard /> },
    { id: "signals", label: "Trading Signals", component: <TradingSignals /> },
    { id: "risk", label: "Risk Metrics", component: <RiskMetricsComponent /> },
    { id: "charts", label: "Market Charts", component: <EquityChart /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Hedge Fund Trading System
            </h1>
            <nav className="flex space-x-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-500 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}
