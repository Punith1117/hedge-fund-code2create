# Hedge Fund Risk Modeling & Semi-Automated Trading System

## Team Information
- **Team Name**: Code2Create Challenge Team
- **Year**: 2026
- **All-Female Team**: [Yes/No]

## Architecture Overview

#### Our system implements a comprehensive hedge fund trading platform with multi-asset strategy execution, advanced risk management, and real-time dashboard visualization.

    - **Data Ingestion**: System processes three datasets (equity prices, macro indicators, multi-asset data) with automatic alignment by date, feature engineering for technical indicators (SMA crossovers, momentum calculations), and macro confirmation filters for enhanced signal generation.
    
    - **Risk Modeling**: Implements Value at Risk (VaR) calculations at 95% and 99% confidence levels, dynamic position sizing using Kelly criterion with safety factors, stop-loss mechanisms at 2% thresholds, and portfolio-level risk limits with real-time violation monitoring.
    
    - **Semi-Automated Strategy**: Multi-asset moving average crossover strategy enhanced with macroeconomic filters, generates BUY/SELL/HOLD signals with confidence scores, respects position limits (30% max per asset), and incorporates realistic transaction costs (0.1% fees + 0.05% slippage).
    
    - **Dashboard Design**: Provides real-time portfolio performance visualization with interactive charts, comprehensive risk metrics display (Sharpe ratio, drawdowns, VaR), asset allocation pie charts, trade execution logs, and signal strength indicators for transparent decision-making.

## Features

### Trading Strategy
- Multi-asset strategy covering Equity, Oil, Gold, and Bonds
- SMA crossover signals with macro confirmation
- Dynamic position sizing based on volatility and signal strength
- Automatic stop-loss and risk limit enforcement

### Risk Management
- Value at Risk (VaR) calculations
- Portfolio volatility monitoring
- Maximum drawdown tracking
- Position size limits and violation alerts
- Sharpe ratio and alpha/beta calculations

### Portfolio Management
- $100,000 initial capital
- Real-time portfolio valuation
- Trade execution with transaction costs
- Performance history tracking
- Win rate and trade statistics

### Dashboard
- Real-time portfolio performance charts
- Asset allocation visualization
- Risk metrics dashboard
- Trading signals display
- Trade history and position tracking

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or pnpm

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 main.py
```

The backend API will be available at `http://localhost:8000`

### Frontend Setup
```bash
cd frontend
npm install  # or pnpm install
npm run dev  # or pnpm dev
```

The frontend dashboard will be available at `http://localhost:3000`

## API Endpoints

### Data Endpoints
- `GET /api/datasets` - Available datasets information
- `GET /api/equity` - Equity price data with SMA indicators
- `GET /api/macro` - Macroeconomic indicators
- `GET /api/multi_asset` - Multi-asset price data

### Trading Strategy
- `GET /api/strategy/signals` - Generate current trading signals
- `POST /api/strategy/execute` - Execute trading strategy

### Portfolio Management
- `GET /api/portfolio/current` - Current portfolio status
- `GET /api/portfolio/performance` - Performance metrics and history
- `GET /api/portfolio/trades` - Trade history
- `POST /api/portfolio/reset` - Reset portfolio

### Risk Management
- `GET /api/risk/metrics` - Current risk metrics
- `POST /api/risk/limits` - Update risk limits

## Risk Parameters

Default risk management settings:
- Maximum position size: 30% of portfolio
- Stop loss threshold: 2%
- Risk per trade: 1% of portfolio
- Maximum portfolio risk: 15%
- Risk-free rate: 2%

## Performance Metrics

The system tracks the following key metrics:
- **Sharpe Ratio**: Risk-adjusted return measure
- **Max Drawdown**: Largest peak-to-trough decline
- **Win Rate**: Percentage of profitable trades
- **Alpha/Beta**: Risk-adjusted performance vs market
- **VaR**: Value at Risk at 95% and 99% confidence

## Data Sources

The system uses three main datasets:
1. **Equity Data**: Daily prices, volumes, and returns with SMA indicators
2. **Macro Data**: Inflation, interest rates, USD index, and sentiment
3. **Multi-Asset Data**: Oil, Gold, and Bond prices with returns

## Technology Stack

### Backend
- **FastAPI**: REST API framework
- **Pandas**: Data processing and analysis
- **NumPy**: Numerical computations
- **SciPy**: Statistical calculations

### Frontend
- **Next.js**: React framework
- **Recharts**: Data visualization library
- **Tailwind CSS**: Styling framework
- **TypeScript**: Type safety

## Usage

1. **Start the System**: Run both backend and frontend servers
2. **View Dashboard**: Navigate to the main dashboard to see portfolio status
3. **Check Signals**: Review current trading signals and their strength
4. **Execute Strategy**: Click "Execute Strategy" to run the trading algorithm
5. **Monitor Risk**: Review risk metrics and ensure compliance with limits
6. **Track Performance**: Monitor portfolio value and performance over time

## Risk Disclaimer

This system is for educational and demonstration purposes only. Real trading involves substantial risk of loss. Always conduct thorough research and consider consulting with financial professionals before making investment decisions.

**Note:** Please do not change the format or spelling of anything in this README. The fields are extracted using a script, so any changes to the structure or formatting may break the extraction process.
