# Hedge Fund Risk Modeling & Semi-Automated Trading System

## Team Information
- **Team Name**: Biased_Coin
- **Year**: 2026
- **All-Female Team**: No

## Overview

This project is a full-stack hedge fund trading simulation platform built for the Code2Create 2026 challenge. It combines a Python-based quantitative backend with a Next.js frontend dashboard to deliver real-time portfolio analytics, risk modeling, and semi-automated multi-asset strategy execution.

The system ingests historical market data across equities, commodities, and bonds, applies macroeconomic filters, generates explainable trading signals, sizes positions using risk-aware algorithms, and visualizes everything through an interactive web dashboard.

---

## Architecture Overview

The platform is split into two independent but integrated services:

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| Backend | Python / FastAPI | Data ingestion, signal generation, portfolio state management, risk calculations, REST API |
| Frontend | Next.js 16 / React 19 / TypeScript | Interactive dashboard, real-time charts, trade execution controls |

```
┌─────────────────────────────────────────────┐
│  Frontend (Next.js) — http://localhost:3000 │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Dashboard  │ │ Signals  │ │  Charts  │ │
│  └─────────────┘ └──────────┘ └──────────┘ │
└──────────────┬──────────────────────────────┘
               │ REST / JSON / CORS
┌──────────────▼──────────────────────────────┐
│  Backend (FastAPI) — http://localhost:8000  │
│  ┌──────────┐ ┌─────────────┐ ┌──────────┐ │
│  │ Strategy │ │  Portfolio  │ │   Risk   │ │
│  │  Engine  │ │  Manager    │ │ Manager  │ │
│  └──────────┘ └─────────────┘ └──────────┘ │
│  ┌──────────┐ ┌─────────────┐ ┌──────────┐ │
│  │  Equity  │ │   Macro     │ │MultiAsset│ │
│  │  Data    │ │   Data      │ │  Data    │ │
│  └──────────┘ └─────────────┘ └──────────┘ │
└─────────────────────────────────────────────┘
```

### Backend Modules

- **`main.py`** — FastAPI application. Defines all REST endpoints, wires modules together, and serves CORS-enabled JSON.
- **`strategy_engine.py`** — Signal generation logic. Computes SMA crossovers, momentum, macro confirmations, and emits typed `TradingSignal` objects.
- **`portfolio_manager.py`** — Portfolio state machine. Tracks cash, open positions, trade history, drawdowns, and realized/unrealized P&L.
- **`risk_management.py`** — Risk analytics engine. Computes VaR, volatility, Sharpe ratio, alpha/beta, rolling metrics, correlation matrices, and position-limit enforcement.

### Frontend Modules

- **`page.tsx`** — Main shell with tab navigation (Dashboard, Trading Signals, Risk Metrics, Market Charts).
- **`Dashboard.tsx`** — Primary view. Fetches and displays key metrics cards, portfolio performance line charts, asset allocation pie charts, positions table, trade history, and embeds all sub-charts.
- **`EquityChart.tsx`** — Dedicated equity price + SMA overlay chart.
- **`TradingSignals.tsx`** — Signal strength display and execution panel.
- **`RiskMetrics.tsx`** — Deep-dive risk metric cards and visualizations.
- **`DrawdownChart.tsx`** — Underwater equity curve.
- **`RollingMetricsChart.tsx`** — Rolling Sharpe / volatility over time.
- **`MultiAssetComparison.tsx`** — Cumulative return comparison across all four assets.
- **`BenchmarkComparison.tsx`** — Portfolio vs equity benchmark.
- **`CorrelationMatrix.tsx`** — Asset return correlation heatmap.
- **`CostAnalysis.tsx`** — Transaction cost breakdown.

---

## Features

### Trading Strategy
- **Multi-asset coverage**: Equity, Oil, Gold, and Bonds.
- **SMA crossover engine**: Golden Cross (20/50/200) for equities; 20-period momentum for commodities.
- **Macro confirmation**: Sentiment, interest rate, and inflation filters boost or suppress signals.
- **Dynamic position sizing**: Risk-adjusted sizing based on volatility and signal strength, capped at 30% per asset.
- **Transaction realism**: 0.1% explicit commission + 0.05% slippage applied to every simulated trade.
- **Automatic stop-loss**: 2% threshold triggers forced exit.

### Risk Management
- **Value at Risk (VaR)**: Historical simulation at 95% and 99% confidence.
- **Portfolio volatility**: Annualized standard deviation of returns.
- **Maximum drawdown**: Peak-to-trough tracking with current drawdown status.
- **Position limit monitoring**: Real-time violation alerts when any asset exceeds 30% of NAV.
- **Sharpe ratio**: Annualized excess return per unit of risk.
- **Alpha / Beta**: Benchmark-relative performance (equity index as market proxy).
- **Rolling metrics**: 30-day rolling Sharpe and volatility trends.
- **Correlation matrix**: Cross-asset return correlations for diversification insight.
- **Stress testing**: Scenario-based P&L shock analysis.

### Portfolio Management
- **Initial capital**: $100,000.
- **Real-time valuation**: Positions re-marked to latest market prices on every update.
- **Trade execution log**: Full audit trail with timestamp, asset, action, quantity, price, value, cost, and P&L.
- **Performance history**: Time-series of total value, cash, daily return, cumulative return, and drawdown.
- **Win rate & statistics**: Aggregate trade-level profitability metrics.
- **Cost analysis**: Total commissions, slippage, and cost-per-trade averages.

### Dashboard
- **Tab-based navigation**: Dashboard, Trading Signals, Risk Metrics, Market Charts.
- **Interactive charts**: Recharts-powered line, pie, bar, and area charts.
- **Key metric cards**: Portfolio value, daily return, Sharpe ratio, max drawdown, beta, alpha, VaR, annualized return.
- **Asset allocation pie chart**: Live breakdown by market value.
- **Portfolio performance chart**: Dual-axis line chart (value + cumulative return %).
- **Drawdown visualization**: Underwater equity curve.
- **Rolling metrics**: Sharpe and volatility windows over time.
- **Multi-asset performance**: Cumulative return comparison (Equity, Oil, Gold, Bonds).
- **Benchmark comparison**: Portfolio alpha vs equity benchmark.
- **Correlation matrix**: Asset pair-wise correlation grid.
- **Cost analysis**: Transaction cost breakdown panel.
- **Macro environment panel**: Inflation, interest rate, USD index, sentiment snapshot.
- **Positions table**: Quantity, entry price, unrealized P&L, market value.
- **Trade history table**: Recent trades with color-coded P&L.
- **Strategy controls**: Refresh, Export CSV, Execute Strategy, Reset Portfolio buttons.

---

## Project Structure

```
hedge-fund-code2create/
├── backend/
│   ├── main.py                  # FastAPI server & REST endpoints
│   ├── strategy_engine.py       # Signal generation (SMA, momentum, macro)
│   ├── portfolio_manager.py     # Portfolio state, trades, history
│   ├── risk_management.py       # VaR, Sharpe, drawdown, correlations
│   ├── requirements.txt         # Python dependencies
│   ├── data/
│   │   └── raw/
│   │       ├── equity_dataset.csv
│   │       ├── macro_dataset.csv
│   │       └── multi_asset_dataset.csv
│   └── venv/                    # Python virtual environment
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx                     # Main layout + tab shell
│   │       ├── layout.tsx                   # Root layout (Geist font, dark mode)
│   │       ├── globals.css                  # Tailwind global styles
│   │       └── components/
│   │           ├── Dashboard.tsx            # Primary dashboard view
│   │           ├── EquityChart.tsx          # Equity + SMA chart
│   │           ├── TradingSignals.tsx       # Signal display
│   │           ├── RiskMetrics.tsx          # Risk deep-dive
│   │           ├── DrawdownChart.tsx        # Drawdown curve
│   │           ├── RollingMetricsChart.tsx  # Rolling Sharpe / vol
│   │           ├── MultiAssetComparison.tsx # Asset return comparison
│   │           ├── BenchmarkComparison.tsx  # Alpha vs benchmark
│   │           ├── CorrelationMatrix.tsx    # Correlation heatmap
│   │           └── CostAnalysis.tsx         # Transaction cost panel
│   ├── package.json             # Next.js 16, React 19, Recharts, Tailwind v4
│   ├── tailwind.config.ts       # Tailwind configuration
│   └── next.config.ts           # Next.js configuration
├── ISSUES.md                    # Full issue tracker (20 issues)
└── README.md                    # This file
```

---

## Technology Stack

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.104.1 | High-performance REST API framework |
| Uvicorn | 0.24.0 | ASGI server |
| Pydantic | 2.5.0 | Data validation |
| Pandas | 2.1.3 | Time-series data manipulation |
| NumPy | 1.26.2 | Numerical computing |
| SciPy | 1.11.4 | Statistical distributions (VaR) |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 16.2.4 | React framework (App Router) |
| React | 19.2.4 | UI library |
| Recharts | 3.8.1 | Composable charting library |
| Tailwind CSS | 4 | Utility-first CSS framework |
| TypeScript | 5 | Static type safety |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 20+
- `npm`, `pnpm`, or `yarn`

### Backend Setup

```bash
cd backend

# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Ensure datasets exist under backend/data/raw/
#    (equity_dataset.csv, macro_dataset.csv, multi_asset_dataset.csv)

# 4. Launch server
python3 main.py
```

The backend API will be available at **`http://localhost:8000`**.

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install        # or: pnpm install / yarn install

# 2. Launch dev server
npm run dev        # or: pnpm dev / yarn dev
```

The frontend dashboard will be available at **`http://localhost:3000`**.

> **Note:** The frontend expects the backend at `http://localhost:8000`. CORS is pre-configured for `localhost:3000` and `localhost:5173`.

---

## API Reference

### Health & Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | API health message |
| `GET`  | `/health` | Health check (`{"status": "healthy"}`) |
| `GET`  | `/api/datasets` | Metadata for all three datasets |
| `GET`  | `/api/equity?limit=&offset=` | Equity prices + SMA_20/50/200 |
| `GET`  | `/api/macro?limit=&offset=` | Macroeconomic indicators |
| `GET`  | `/api/multi_asset?limit=&offset=` | Oil, Gold, Bonds prices |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/equity/stats` | Price, volume, return statistics |
| `GET`  | `/api/macro/stats` | Inflation, interest rate, USD, sentiment stats |
| `GET`  | `/api/multi_asset/stats` | Oil, Gold, Bonds statistics |

### Strategy

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/strategy/signals` | Generate current BUY/SELL/HOLD signals |
| `POST` | `/api/strategy/execute` | Run strategy, execute trades, update portfolio |

### Portfolio

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/portfolio/current` | Current positions, cash, allocation |
| `GET`  | `/api/portfolio/performance` | Metrics, risk, value history (last 500 pts) |
| `GET`  | `/api/portfolio/trades?limit=` | Recent trade history |
| `POST` | `/api/portfolio/reset` | Reset to $100,000 initial state |
| `GET`  | `/api/portfolio/drawdown-history` | Drawdown time-series (last 500 pts) |
| `GET`  | `/api/portfolio/rolling-metrics?window=` | Rolling Sharpe / volatility |
| `GET`  | `/api/portfolio/benchmark-comparison` | Portfolio vs equity benchmark |
| `GET`  | `/api/portfolio/cost-analysis` | Transaction cost breakdown |

### Risk

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/risk/metrics` | VaR, volatility, drawdown, Sharpe, beta, alpha |
| `POST` | `/api/risk/limits?max_position_size=&stop_loss_threshold=` | Update risk limits |
| `GET`  | `/api/metrics/correlation-matrix` | Asset return correlation matrix |

### Multi-Asset Performance

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/multi-asset/performance` | Cumulative returns for Equity, Oil, Gold, Bonds |

---

## Strategy Details

### Equity Strategy (SMA Crossover + Macro)
- **Golden Cross**: `SMA_20 > SMA_50 > SMA_200` and price > `SMA_20` → **BUY**
  - Strength boosted by +0.3 if macro positive (sentiment > 0, interest rate < 5%).
- **Death Cross**: `SMA_20 < SMA_50 < SMA_200` and price < `SMA_20` → **SELL**
  - Strength boosted by +0.3 if macro negative.

### Commodity / Bond Strategy (Momentum + Macro Filter)
- 20-period momentum calculated for Oil, Gold, and Bonds.
- **BUY** if momentum > +2% and macro filter passes.
- **SELL** if momentum < -2% and macro filter fails.
- Macro filters:
  - **Oil**: Buy when inflation > 2.5%.
  - **Gold**: Buy when sentiment < 0 or interest rate > 4%.
  - **Bonds**: Buy when interest rate < 3.5%.

### Position Sizing
- Base risk per trade: 1% of portfolio NAV.
- Volatility-adjusted: larger positions for lower-volatility assets.
- Signal-strength multiplier: stronger signals get larger allocations.
- Hard cap: 30% of portfolio in any single asset.
- Kelly criterion variant (quarter-Kelly safety factor) available in `risk_management.py`.

---

## Risk Parameters

| Parameter | Default Value | Description |
|-----------|--------------|-------------|
| Max position size | 30% | Per-asset ceiling |
| Stop-loss threshold | 2% | Force-exit trigger |
| Risk per trade | 1% | Capital at risk per signal |
| Max portfolio risk | 15% | Aggregate risk budget |
| Risk-free rate | 2% | Sharpe ratio denominator |
| Transaction cost | 0.1% | Commission per trade |
| Slippage | 0.05% | Execution price impact |

All parameters are runtime-adjustable via `/api/risk/limits`.

---

## Performance Metrics

| Metric | Description | Computation |
|--------|-------------|-------------|
| **Total Return** | Absolute gain/loss since inception | `(Current / Initial) - 1` |
| **Daily Return** | Day-over-day portfolio change | `(Today / Yesterday) - 1` |
| **Sharpe Ratio** | Risk-adjusted return | `(Mean excess return / StdDev) × √252` |
| **Max Drawdown** | Worst peak-to-trough decline | `min(Cumulative / RunningMax - 1)` |
| **Current Drawdown** | Current decline from peak | `(Current / Peak) - 1` |
| **Win Rate** | Profitable trade percentage | `Wins / Total Trades` |
| **Alpha** | Excess return vs benchmark | `Portfolio return - (Rf + β × (Market - Rf))` |
| **Beta** | Market sensitivity | `Cov(Portfolio, Market) / Var(Market)` |
| **VaR 95%** | 5th percentile daily loss | Historical percentile |
| **VaR 99%** | 1st percentile daily loss | Historical percentile |
| **Volatility** | Annualized return StdDev | `StdDev(daily returns) × √252` |

---

## Data Sources

The simulation consumes three CSV datasets located in `backend/data/raw/`:

1. **Equity Dataset** (`equity_dataset.csv`)
   - Columns: `Date`, `Price`, `Volume`, `Returns`
   - Enriched at load time with `SMA_20`, `SMA_50`, `SMA_200`.

2. **Macro Dataset** (`macro_dataset.csv`)
   - Columns: `Date`, `Inflation`, `Interest_Rate`, `USD_Index`, `Sentiment`
   - Used for directional filtering and signal-strength modulation.

3. **Multi-Asset Dataset** (`multi_asset_dataset.csv`)
   - Columns: `Date`, `Oil`, `Gold`, `Bonds`, `Oil_Returns`, `Gold_Returns`, `Bonds_Returns`
   - Momentum signals and cross-asset diversification inputs.

---

## Dashboard Usage Guide

1. **Launch both servers** (backend first, then frontend).
2. **Open `http://localhost:3000`** — you will land on the **Dashboard** tab.
3. **Review key metric cards** at the top. Green / red color coding indicates direction.
4. **Scroll to charts** — portfolio value, allocation, drawdown, rolling Sharpe, multi-asset comparison, benchmark alpha, correlation matrix, and cost analysis.
5. **Check macro snapshot** — current inflation, rates, USD index, sentiment.
6. **Switch to Trading Signals tab** — inspect current signal strength and reasoning.
7. **Click "Execute Strategy"** — the backend will generate signals, size positions, apply costs, and update the portfolio state.
8. **Switch to Risk Metrics tab** — deep-dive into VaR, volatility, and drawdown analytics.
9. **Export data** — click "Export Data" to download portfolio history as CSV.
10. **Reset anytime** — click "Reset Portfolio" to restore $100,000 cash and clear all positions/trades.

---

## Development

### Backend Development
- The API uses `CORSMiddleware` to allow frontend access from `localhost:3000`.
- All endpoints wrap exceptions in `HTTPException(status_code=500, detail=...)` for consistent JSON error responses.
- `NaN` values in Pandas DataFrames are explicitly replaced with `None` before JSON serialization to prevent `ValueError`.

### Frontend Development
- The project uses **Next.js 16** with the App Router (`src/app/`).
- Styling is handled by **Tailwind CSS v4** via `@tailwindcss/postcss`.
- Charts are rendered with **Recharts** inside `ResponsiveContainer` for fluid layouts.
- All data fetching uses standard `fetch()` against `http://localhost:8000`.

### Extending the Strategy
- Modify `strategy_engine.py` to add new indicators (RSI, Bollinger Bands, etc.).
- Add new assets by extending `multi_asset_data` processing in `main.py` and `portfolio_manager.py`.
- Update risk models in `risk_management.py` (e.g., switch to parametric VaR or Monte Carlo).

---

## Known Limitations & Future Work

- **Data ingestion pipeline** currently loads CSVs at startup. A streaming or database-backed pipeline would improve scalability (see `ISSUES.md` #1).
- **Missing data / outliers** are not yet robustly handled (see `ISSUES.md` #2).
- **Rebalancing** is signal-driven rather than calendar-based (see `ISSUES.md` #11).
- **ML-based signals** are not yet implemented; the current engine is fully rule-based (see `ISSUES.md` #8).
- **Real-time websocket feeds** are not implemented; the dashboard polls REST endpoints.

See `ISSUES.md` for the full tracker of 20 planned improvements.

---

## Risk Disclaimer

This system is for **educational and demonstration purposes only**. It does **not** execute real trades, does **not** connect to live brokerages, and does **not** constitute financial advice. Real trading involves substantial risk of loss. Always conduct thorough research and consider consulting with financial professionals before making investment decisions.

---

**Note:** Please do not change the format or spelling of anything in the "Team Information" section above. The fields are extracted using a script, so any changes to the structure or formatting may break the extraction process.

