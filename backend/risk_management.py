import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from scipy import stats

@dataclass
class RiskMetrics:
    var_95: float  # Value at Risk at 95% confidence
    var_99: float  # Value at Risk at 99% confidence
    volatility: float  # Annualized volatility
    max_drawdown: float
    current_drawdown: float
    sharpe_ratio: float
    beta: float
    alpha: float
    portfolio_volatility: float

class RiskManager:
    def __init__(self, risk_free_rate: float = 0.02):
        self.risk_free_rate = risk_free_rate
        self.max_portfolio_risk = 0.15  # 15% max portfolio risk
        self.max_position_size = 0.30  # 30% max per position
        self.stop_loss_threshold = 0.02  # 2% stop loss
        
    def calculate_portfolio_risk(self, portfolio_returns: pd.Series, 
                                benchmark_returns: pd.Series = None) -> RiskMetrics:
        """Calculate comprehensive risk metrics for portfolio"""
        if len(portfolio_returns) < 30:
            # Return default values if insufficient data
            return RiskMetrics(0, 0, 0, 0, 0, 0, 1, 0, 0, 0)
        
        # Calculate returns statistics
        mean_return = portfolio_returns.mean()
        volatility = portfolio_returns.std() * np.sqrt(252)  # Annualized
        
        # Calculate VaR
        var_95 = np.percentile(portfolio_returns, 5)
        var_99 = np.percentile(portfolio_returns, 1)
        
        # Calculate drawdowns
        cumulative_returns = (1 + portfolio_returns).cumprod()
        running_max = cumulative_returns.expanding().max()
        drawdown = (cumulative_returns - running_max) / running_max
        max_drawdown = drawdown.min()
        current_drawdown = drawdown.iloc[-1]
        
        # Calculate Sharpe ratio
        excess_returns = portfolio_returns - self.risk_free_rate / 252
        sharpe_ratio = excess_returns.mean() / portfolio_returns.std() * np.sqrt(252) if portfolio_returns.std() > 0 else 0
        
        # Calculate beta and alpha if benchmark provided
        beta = 1.0
        alpha = 0.0
        if benchmark_returns is not None and len(benchmark_returns) == len(portfolio_returns):
            covariance = np.cov(portfolio_returns, benchmark_returns)[0, 1]
            benchmark_variance = np.var(benchmark_returns)
            beta = covariance / benchmark_variance if benchmark_variance > 0 else 1.0
            alpha = mean_return * 252 - (self.risk_free_rate + beta * (benchmark_returns.mean() * 252 - self.risk_free_rate))
        
        return RiskMetrics(
            var_95=var_95,
            var_99=var_99,
            volatility=volatility,
            max_drawdown=max_drawdown,
            current_drawdown=current_drawdown,
            sharpe_ratio=sharpe_ratio,
            beta=beta,
            alpha=alpha,
            portfolio_volatility=volatility
        )
    
    def check_position_limits(self, positions: Dict[str, float], 
                            portfolio_value: float) -> List[str]:
        """Check if position limits are violated"""
        violations = []
        
        for asset, position_value in positions.items():
            position_pct = position_value / portfolio_value
            if position_pct > self.max_position_size:
                violations.append(f"{asset}: {position_pct:.1%} exceeds max position size of {self.max_position_size:.1%}")
        
        return violations
    
    def calculate_stop_loss_price(self, entry_price: float, is_long: bool = True) -> float:
        """Calculate stop loss price for a position"""
        if is_long:
            return entry_price * (1 - self.stop_loss_threshold)
        else:
            return entry_price * (1 + self.stop_loss_threshold)
    
    def should_trigger_stop_loss(self, current_price: float, entry_price: float, 
                                is_long: bool = True) -> bool:
        """Check if stop loss should be triggered"""
        stop_loss_price = self.calculate_stop_loss_price(entry_price, is_long)
        
        if is_long:
            return current_price <= stop_loss_price
        else:
            return current_price >= stop_loss_price
    
    def calculate_optimal_position_size(self, signal_strength: float, 
                                     asset_volatility: float,
                                     portfolio_value: float,
                                     correlation_with_portfolio: float = 0.5) -> float:
        """Calculate optimal position size using Kelly criterion with risk adjustments"""
        # Basic Kelly fraction
        kelly_fraction = (signal_strength * 0.5) / (asset_volatility ** 2)
        
        # Adjust for correlation
        correlation_adjustment = 1 - abs(correlation_with_portfolio)
        adjusted_kelly = kelly_fraction * correlation_adjustment
        
        # Apply safety factor (quarter Kelly for safety)
        safe_kelly = adjusted_kelly * 0.25
        
        # Cap at maximum position size
        max_position_value = portfolio_value * self.max_position_size
        
        return min(safe_kelly * portfolio_value, max_position_value)
    
    def calculate_portfolio_var(self, positions: Dict[str, float], 
                              returns_matrix: pd.DataFrame,
                              confidence_level: float = 0.95) -> float:
        """Calculate portfolio VaR using variance-covariance method"""
        if len(positions) == 0 or len(returns_matrix) < 30:
            return 0.0
        
        # Get returns for assets in portfolio
        portfolio_assets = list(positions.keys())
        asset_returns = returns_matrix[portfolio_assets].copy()
        
        # Calculate covariance matrix
        cov_matrix = asset_returns.cov() * 252  # Annualized
        
        # Calculate portfolio weights
        total_value = sum(positions.values())
        weights = np.array([positions[asset] / total_value for asset in portfolio_assets])
        
        # Calculate portfolio variance
        portfolio_variance = np.dot(weights.T, np.dot(cov_matrix, weights))
        portfolio_volatility = np.sqrt(portfolio_variance)
        
        # Calculate VaR
        z_score = stats.norm.ppf(1 - confidence_level)
        portfolio_var = -z_score * portfolio_volatility
        
        return portfolio_var
    
    def stress_test_portfolio(self, positions: Dict[str, float],
                            historical_scenarios: Dict[str, float]) -> Dict[str, float]:
        """Perform stress testing on portfolio"""
        stress_results = {}
        
        for scenario_name, scenario_shock in historical_scenarios.items():
            scenario_pnl = 0.0
            for asset, position_value in positions.items():
                # Apply scenario shock to position
                asset_shock = scenario_shock  # Simplified: same shock for all assets
                scenario_pnl += position_value * asset_shock
            
            stress_results[scenario_name] = scenario_pnl
        
        return stress_results
    
    def get_risk_limits(self) -> Dict[str, float]:
        """Get current risk limits"""
        return {
            'max_portfolio_risk': self.max_portfolio_risk,
            'max_position_size': self.max_position_size,
            'stop_loss_threshold': self.stop_loss_threshold,
            'risk_free_rate': self.risk_free_rate
        }
    
    def update_risk_parameters(self, **kwargs):
        """Update risk management parameters"""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
