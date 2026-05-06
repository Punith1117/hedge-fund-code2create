from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
from typing import List, Dict, Any
from datetime import datetime
from strategy_engine import TradingStrategy, TradingSignal, SignalType
from portfolio_manager import PortfolioManager
from risk_management import RiskManager

app = FastAPI(
    title="Hedge Fund API",
    description="API for hedge fund data analysis and trading strategies",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load datasets
equity_data = pd.read_csv("data/raw/equity_dataset.csv")
macro_data = pd.read_csv("data/raw/macro_dataset.csv")
multi_asset_data = pd.read_csv("data/raw/multi_asset_dataset.csv")

# Calculate additional SMAs for equity data
equity_data['SMA_20'] = equity_data['Price'].rolling(window=20).mean()
equity_data['SMA_50'] = equity_data['Price'].rolling(window=50).mean()
equity_data['SMA_200'] = equity_data['Price'].rolling(window=200).mean()

# Initialize portfolio manager
portfolio_manager = PortfolioManager(initial_capital=100000)
risk_manager = RiskManager()

@app.get("/")
async def root():
    return {"message": "Hedge Fund API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/datasets")
async def get_datasets():
    """Get available datasets"""
    return {
        "datasets": [
            {
                "name": "equity",
                "description": "Equity price and volume data",
                "columns": equity_data.columns.tolist(),
                "rows": len(equity_data)
            },
            {
                "name": "macro",
                "description": "Macroeconomic indicators",
                "columns": macro_data.columns.tolist(),
                "rows": len(macro_data)
            },
            {
                "name": "multi_asset",
                "description": "Multi-asset price data (Oil, Gold, Bonds)",
                "columns": multi_asset_data.columns.tolist(),
                "rows": len(multi_asset_data)
            }
        ]
    }

@app.get("/api/equity")
async def get_equity_data(limit: int = 100, offset: int = 0):
    """Get equity price data with SMA indicators"""
    try:
        data = equity_data.iloc[offset:offset+limit].copy()
        # Select only relevant columns for the chart
        data = data[['Date', 'Price', 'SMA_20', 'SMA_50', 'SMA_200']]
        # Replace NaN values with None for JSON serialization
        data = data.replace({np.nan: None})
        return {
            "data": data.to_dict(orient="records"),
            "total_rows": len(equity_data),
            "returned_rows": len(data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/macro")
async def get_macro_data(limit: int = 100, offset: int = 0):
    """Get macroeconomic data"""
    try:
        data = macro_data.iloc[offset:offset+limit].copy()
        # Replace NaN values with None for JSON serialization
        data = data.replace({np.nan: None})
        return {
            "data": data.to_dict(orient="records"),
            "total_rows": len(macro_data),
            "returned_rows": len(data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/multi_asset")
async def get_multi_asset_data(limit: int = 100, offset: int = 0):
    """Get multi-asset data"""
    try:
        data = multi_asset_data.iloc[offset:offset+limit].copy()
        # Replace NaN values with None for JSON serialization
        data = data.replace({np.nan: None})
        return {
            "data": data.to_dict(orient="records"),
            "total_rows": len(multi_asset_data),
            "returned_rows": len(data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/equity/stats")
async def get_equity_stats():
    """Get basic statistics for equity data"""
    try:
        stats = {
            "price_stats": equity_data["Price"].describe().to_dict(),
            "volume_stats": equity_data["Volume"].describe().to_dict(),
            "returns_stats": equity_data["Returns"].dropna().describe().to_dict()
        }
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/macro/stats")
async def get_macro_stats():
    """Get basic statistics for macro data"""
    try:
        stats = {}
        for col in ["Inflation", "Interest_Rate", "USD_Index", "Sentiment"]:
            stats[f"{col.lower()}_stats"] = macro_data[col].describe().to_dict()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/multi_asset/stats")
async def get_multi_asset_stats():
    """Get basic statistics for multi-asset data"""
    try:
        stats = {}
        for col in ["Oil", "Gold", "Bonds"]:
            stats[f"{col.lower()}_stats"] = multi_asset_data[col].describe().to_dict()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Trading Strategy Endpoints

@app.get("/api/strategy/signals")
async def get_trading_signals():
    """Generate current trading signals"""
    try:
        strategy = TradingStrategy()
        signals = strategy.generate_signals(equity_data, macro_data, multi_asset_data)
        
        signal_list = []
        for signal in signals:
            signal_list.append({
                "asset": signal.asset,
                "signal_type": signal.signal_type.value,
                "strength": signal.strength,
                "price": signal.price,
                "timestamp": signal.timestamp,
                "reason": signal.reason
            })
        
        return {
            "signals": signal_list,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/strategy/execute")
async def execute_strategy():
    """Execute trading strategy and update portfolio"""
    try:
        # Get current prices
        latest_equity = equity_data.iloc[-1]
        latest_multi_asset = multi_asset_data.iloc[-1]
        
        current_prices = {
            "Equity": latest_equity['Price'],
            "Oil": latest_multi_asset['Oil'],
            "Gold": latest_multi_asset['Gold'],
            "Bonds": latest_multi_asset['Bonds']
        }
        
        # Generate signals
        strategy = TradingStrategy()
        signals = strategy.generate_signals(equity_data, macro_data, multi_asset_data)
        
        # Execute signals
        executed_trades = portfolio_manager.process_signals(signals, current_prices)
        
        # Update portfolio value
        current_date = latest_equity['Date']
        portfolio_manager.update_portfolio_value(current_prices, current_date)
        
        # Return execution results
        trade_results = []
        for trade in executed_trades:
            trade_results.append({
                "timestamp": trade.timestamp,
                "asset": trade.asset,
                "action": trade.action,
                "quantity": trade.quantity,
                "price": trade.price,
                "value": trade.value,
                "transaction_cost": trade.transaction_cost,
                "pnl": trade.pnl
            })
        
        return {
            "executed_trades": trade_results,
            "portfolio_value": portfolio_manager.current_capital,
            "signals_generated": len(signals),
            "executed_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Portfolio Management Endpoints

@app.get("/api/portfolio/current")
async def get_current_portfolio():
    """Get current portfolio status and allocation"""
    try:
        metrics = portfolio_manager.get_portfolio_metrics()
        
        # Format positions for response
        positions = {}
        for asset, position in portfolio_manager.positions.items():
            positions[asset] = {
                "quantity": position['quantity'],
                "entry_price": position['entry_price'],
                "current_price": position['current_price'],
                "entry_date": position['entry_date'],
                "unrealized_pnl": position['unrealized_pnl'],
                "realized_pnl": position['realized_pnl'],
                "market_value": position['quantity'] * position['current_price']
            }
        
        return {
            "total_value": metrics.get('total_value', 0),
            "cash": portfolio_manager.cash,
            "positions": positions,
            "allocation": metrics.get('allocation', {}),
            "positions_count": len(portfolio_manager.positions),
            "updated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/portfolio/performance")
async def get_portfolio_performance():
    """Get portfolio performance metrics and history"""
    try:
        metrics = portfolio_manager.get_portfolio_metrics()
        history = portfolio_manager.get_portfolio_history()
        
        # Format risk metrics
        risk_metrics = metrics.get('risk_metrics')
        risk_data = None
        if risk_metrics:
            risk_data = {
                "var_95": risk_metrics.var_95,
                "var_99": risk_metrics.var_99,
                "volatility": risk_metrics.volatility,
                "max_drawdown": risk_metrics.max_drawdown,
                "current_drawdown": risk_metrics.current_drawdown,
                "sharpe_ratio": risk_metrics.sharpe_ratio,
                "beta": risk_metrics.beta,
                "alpha": risk_metrics.alpha
            }
        
        return {
            "performance_metrics": {
                "total_value": metrics.get('total_value', 0),
                "total_return": metrics.get('total_return', 0),
                "daily_return": metrics.get('daily_return', 0),
                "total_trades": metrics.get('total_trades', 0),
                "win_rate": metrics.get('win_rate', 0),
                "initial_capital": portfolio_manager.initial_capital
            },
            "risk_metrics": risk_data,
            "history": history[-500:],  # Last 500 data points
            "updated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/portfolio/trades")
async def get_trade_history(limit: int = 100):
    """Get recent trade history"""
    try:
        trades = portfolio_manager.get_trade_history(limit)
        return {
            "trades": trades,
            "total_trades": len(portfolio_manager.trades),
            "limit": limit,
            "updated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/portfolio/reset")
async def reset_portfolio():
    """Reset portfolio to initial state"""
    try:
        portfolio_manager.reset_portfolio()
        return {
            "message": "Portfolio reset successfully",
            "initial_capital": portfolio_manager.initial_capital,
            "current_value": portfolio_manager.current_capital,
            "reset_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Risk Management Endpoints

@app.get("/api/risk/metrics")
async def get_current_risk_metrics():
    """Get current risk metrics for the portfolio"""
    try:
        # Get portfolio returns
        history = portfolio_manager.get_portfolio_history()
        if len(history) < 30:
            return {"error": "Insufficient data for risk calculations"}
        
        returns = pd.Series([h['daily_return'] for h in history])
        risk_metrics = risk_manager.calculate_portfolio_risk(returns)
        
        # Check position limits
        portfolio_value = portfolio_manager.current_capital
        positions = {}
        for asset, position in portfolio_manager.positions.items():
            positions[asset] = position['quantity'] * position['current_price']
        
        violations = risk_manager.check_position_limits(positions, portfolio_value)
        
        return {
            "risk_metrics": {
                "var_95": risk_metrics.var_95,
                "var_99": risk_metrics.var_99,
                "volatility": risk_metrics.volatility,
                "max_drawdown": risk_metrics.max_drawdown,
                "current_drawdown": risk_metrics.current_drawdown,
                "sharpe_ratio": risk_metrics.sharpe_ratio,
                "beta": risk_metrics.beta,
                "alpha": risk_metrics.alpha
            },
            "risk_limits": risk_manager.get_risk_limits(),
            "position_violations": violations,
            "risk_level": "LOW" if risk_metrics.volatility < 0.15 else "MEDIUM" if risk_metrics.volatility < 0.25 else "HIGH",
            "updated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/risk/limits")
async def update_risk_limits(max_position_size: float = 0.30, stop_loss_threshold: float = 0.02):
    """Update risk management limits"""
    try:
        risk_manager.update_risk_parameters(
            max_position_size=max_position_size,
            stop_loss_threshold=stop_loss_threshold
        )
        
        return {
            "message": "Risk limits updated successfully",
            "new_limits": risk_manager.get_risk_limits(),
            "updated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
