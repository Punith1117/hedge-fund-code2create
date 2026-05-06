import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from strategy_engine import TradingStrategy, TradingSignal, SignalType
from risk_management import RiskManager, RiskMetrics

@dataclass
class Trade:
    timestamp: str
    asset: str
    action: str  # BUY or SELL
    quantity: float
    price: float
    value: float
    transaction_cost: float
    pnl: float = 0.0

@dataclass
class PortfolioSnapshot:
    timestamp: str
    total_value: float
    cash: float
    positions: Dict[str, Dict]
    daily_return: float = 0.0
    cumulative_return: float = 0.0

class PortfolioManager:
    def __init__(self, initial_capital: float = 100000):
        self.initial_capital = initial_capital
        self.current_capital = initial_capital
        self.cash = initial_capital
        self.positions: Dict[str, Dict] = {}  # asset -> position details
        self.trades: List[Trade] = []
        self.portfolio_history: List[PortfolioSnapshot] = []
        self.strategy = TradingStrategy(initial_capital)
        self.risk_manager = RiskManager()
        
    def process_signals(self, signals: List[TradingSignal], current_prices: Dict[str, float]) -> List[Trade]:
        """Process trading signals and execute trades"""
        executed_trades = []
        
        for signal in signals:
            if signal.asset not in current_prices:
                continue
                
            current_price = current_prices[signal.asset]
            
            # Check risk limits before executing
            if not self._check_risk_limits(signal, current_price):
                continue
            
            trade = self._execute_signal(signal, current_price)
            if trade:
                executed_trades.append(trade)
                self.trades.append(trade)
        
        return executed_trades
    
    def _check_risk_limits(self, signal: TradingSignal, current_price: float) -> bool:
        """Check if trade complies with risk management rules"""
        # Check position size limits
        portfolio_value = self.current_capital
        max_position_value = portfolio_value * self.risk_manager.max_position_size
        
        if signal.signal_type == SignalType.BUY:
            position_size = self.strategy.calculate_position_size(signal, portfolio_value)
            if position_value := position_size > max_position_value:
                return False
        
        # Check stop loss for existing positions
        if signal.asset in self.positions:
            position = self.positions[signal.asset]
            is_long = position['quantity'] > 0
            entry_price = position['entry_price']
            
            if self.risk_manager.should_trigger_stop_loss(current_price, entry_price, is_long):
                # Force sell if stop loss triggered
                return True
        
        return True
    
    def _execute_signal(self, signal: TradingSignal, current_price: float) -> Optional[Trade]:
        """Execute a trading signal"""
        portfolio_value = self.current_capital
        
        if signal.signal_type == SignalType.BUY:
            # Calculate position size
            position_size = self.strategy.calculate_position_size(signal, portfolio_value)
            quantity = position_size / current_price
            trade_value = quantity * current_price
            transaction_cost = trade_value * self.strategy.transaction_cost
            total_cost = trade_value + transaction_cost
            
            if total_cost > self.cash:
                return None
            
            # Execute buy
            self.cash -= total_cost
            
            if signal.asset in self.positions:
                # Add to existing position
                existing_pos = self.positions[signal.asset]
                total_quantity = existing_pos['quantity'] + quantity
                avg_price = ((existing_pos['quantity'] * existing_pos['entry_price']) + 
                           (quantity * current_price)) / total_quantity
                
                self.positions[signal.asset] = {
                    'quantity': total_quantity,
                    'entry_price': avg_price,
                    'current_price': current_price,
                    'entry_date': signal.timestamp,
                    'unrealized_pnl': 0.0,
                    'realized_pnl': existing_pos['realized_pnl']
                }
            else:
                # New position
                self.positions[signal.asset] = {
                    'quantity': quantity,
                    'entry_price': current_price,
                    'current_price': current_price,
                    'entry_date': signal.timestamp,
                    'unrealized_pnl': 0.0,
                    'realized_pnl': 0.0
                }
            
            return Trade(
                timestamp=signal.timestamp,
                asset=signal.asset,
                action="BUY",
                quantity=quantity,
                price=current_price,
                value=trade_value,
                transaction_cost=transaction_cost
            )
            
        elif signal.signal_type == SignalType.SELL:
            if signal.asset not in self.positions:
                return None
            
            position = self.positions[signal.asset]
            quantity = min(position['quantity'], position['quantity'])  # Sell full position
            
            if quantity <= 0:
                return None
            
            trade_value = quantity * current_price
            transaction_cost = trade_value * self.strategy.transaction_cost
            net_proceeds = trade_value - transaction_cost
            
            # Calculate realized P&L
            realized_pnl = (current_price - position['entry_price']) * quantity - transaction_cost
            
            # Execute sell
            self.cash += net_proceeds
            position['realized_pnl'] += realized_pnl
            
            # Remove position if fully sold
            if abs(position['quantity'] - quantity) < 0.001:
                del self.positions[signal.asset]
            else:
                position['quantity'] -= quantity
            
            return Trade(
                timestamp=signal.timestamp,
                asset=signal.asset,
                action="SELL",
                quantity=quantity,
                price=current_price,
                value=trade_value,
                transaction_cost=transaction_cost,
                pnl=realized_pnl
            )
        
        return None
    
    def update_portfolio_value(self, current_prices: Dict[str, float], timestamp: str):
        """Update portfolio value with current prices"""
        total_value = self.cash
        
        # Update position values
        for asset, position in self.positions.items():
            if asset in current_prices:
                current_price = current_prices[asset]
                position['current_price'] = current_price
                position_value = position['quantity'] * current_price
                position['unrealized_pnl'] = (current_price - position['entry_price']) * position['quantity']
                total_value += position_value
        
        self.current_capital = total_value
        
        # Create portfolio snapshot
        daily_return = 0.0
        if len(self.portfolio_history) > 0:
            prev_value = self.portfolio_history[-1].total_value
            daily_return = (total_value - prev_value) / prev_value if prev_value > 0 else 0.0
        
        cumulative_return = (total_value - self.initial_capital) / self.initial_capital
        
        snapshot = PortfolioSnapshot(
            timestamp=timestamp,
            total_value=total_value,
            cash=self.cash,
            positions=self.positions.copy(),
            daily_return=daily_return,
            cumulative_return=cumulative_return
        )
        
        self.portfolio_history.append(snapshot)
    
    def get_portfolio_metrics(self) -> Dict:
        """Get current portfolio performance metrics"""
        if len(self.portfolio_history) < 2:
            return {}
        
        # Calculate returns series
        returns = pd.Series([snap.daily_return for snap in self.portfolio_history])
        
        # Calculate risk metrics
        risk_metrics = self.risk_manager.calculate_portfolio_risk(returns)
        
        # Calculate additional metrics
        total_return = self.current_capital / self.initial_capital - 1
        total_trades = len(self.trades)
        winning_trades = len([t for t in self.trades if t.pnl > 0])
        win_rate = winning_trades / total_trades if total_trades > 0 else 0
        
        # Current allocation
        allocation = {}
        for asset, position in self.positions.items():
            allocation[asset] = position['quantity'] * position['current_price']
        
        return {
            'total_value': self.current_capital,
            'total_return': total_return,
            'daily_return': self.portfolio_history[-1].daily_return if self.portfolio_history else 0,
            'cash': self.cash,
            'allocation': allocation,
            'risk_metrics': risk_metrics,
            'total_trades': total_trades,
            'win_rate': win_rate,
            'positions_count': len(self.positions)
        }
    
    def get_trade_history(self, limit: int = 100) -> List[Dict]:
        """Get recent trade history"""
        recent_trades = self.trades[-limit:] if limit > 0 else self.trades
        return [
            {
                'timestamp': trade.timestamp,
                'asset': trade.asset,
                'action': trade.action,
                'quantity': trade.quantity,
                'price': trade.price,
                'value': trade.value,
                'transaction_cost': trade.transaction_cost,
                'pnl': trade.pnl
            }
            for trade in recent_trades
        ]
    
    def get_portfolio_history(self) -> List[Dict]:
        """Get portfolio value history"""
        return [
            {
                'timestamp': snap.timestamp,
                'total_value': snap.total_value,
                'cash': snap.cash,
                'daily_return': snap.daily_return,
                'cumulative_return': snap.cumulative_return
            }
            for snap in self.portfolio_history
        ]
    
    def reset_portfolio(self):
        """Reset portfolio to initial state"""
        self.current_capital = self.initial_capital
        self.cash = self.initial_capital
        self.positions = {}
        self.trades = []
        self.portfolio_history = []
