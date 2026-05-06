import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

class SignalType(Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"

@dataclass
class TradingSignal:
    asset: str
    signal_type: SignalType
    strength: float  # 0-1 confidence level
    price: float
    timestamp: str
    reason: str

@dataclass
class Position:
    asset: str
    quantity: float
    entry_price: float
    current_price: float
    entry_date: str
    unrealized_pnl: float
    realized_pnl: float

class TradingStrategy:
    def __init__(self, initial_capital: float = 100000):
        self.initial_capital = initial_capital
        self.current_capital = initial_capital
        self.positions: Dict[str, Position] = {}
        self.cash = initial_capital
        self.transaction_cost = 0.001  # 0.1% per trade
        self.slippage = 0.0005  # 0.05% slippage
        
    def generate_signals(self, equity_data: pd.DataFrame, macro_data: pd.DataFrame, 
                        multi_asset_data: pd.DataFrame) -> List[TradingSignal]:
        """Generate trading signals using multi-asset strategy with macro confirmation"""
        signals = []
        
        # Ensure data is aligned by date
        equity_data = equity_data.copy()
        macro_data = macro_data.copy()
        multi_asset_data = multi_asset_data.copy()
        
        equity_data['Date'] = pd.to_datetime(equity_data['Date'])
        macro_data['Date'] = pd.to_datetime(macro_data['Date'])
        multi_asset_data['Date'] = pd.to_datetime(multi_asset_data['Date'])
        
        # Generate signals for each asset
        signals.extend(self._generate_equity_signals(equity_data, macro_data))
        signals.extend(self._generate_multi_asset_signals(multi_asset_data, macro_data))
        
        return signals
    
    def _generate_equity_signals(self, equity_data: pd.DataFrame, macro_data: pd.DataFrame) -> List[TradingSignal]:
        """Generate equity trading signals using SMA crossover with macro confirmation"""
        signals = []
        
        if len(equity_data) < 200:
            return signals
            
        latest_equity = equity_data.iloc[-1]
        latest_macro = macro_data.iloc[-1]
        
        # SMA crossover signals
        sma_20 = latest_equity.get('SMA_20')
        sma_50 = latest_equity.get('SMA_50')
        sma_200 = latest_equity.get('SMA_200')
        price = latest_equity['Price']
        
        if pd.isna(sma_20) or pd.isna(sma_50) or pd.isna(sma_200):
            return signals
            
        # Macro confirmation
        macro_positive = (
            latest_macro['Sentiment'] > 0 and
            latest_macro['Interest_Rate'] < 5.0  # Reasonable interest rate environment
        )
        
        signal_strength = 0.5  # Base strength
        
        # Golden Cross: SMA_20 > SMA_50 > SMA_200
        if sma_20 > sma_50 > sma_200 and price > sma_20:
            if macro_positive:
                signal_strength += 0.3
            signals.append(TradingSignal(
                asset="Equity",
                signal_type=SignalType.BUY,
                strength=min(signal_strength, 1.0),
                price=price,
                timestamp=latest_equity['Date'].strftime('%Y-%m-%d'),
                reason="Golden Cross with macro confirmation"
            ))
        
        # Death Cross: SMA_20 < SMA_50 < SMA_200
        elif sma_20 < sma_50 < sma_200 and price < sma_20:
            if not macro_positive:
                signal_strength += 0.3
            signals.append(TradingSignal(
                asset="Equity",
                signal_type=SignalType.SELL,
                strength=min(signal_strength, 1.0),
                price=price,
                timestamp=latest_equity['Date'].strftime('%Y-%m-%d'),
                reason="Death Cross with macro confirmation"
            ))
        
        return signals
    
    def _generate_multi_asset_signals(self, multi_asset_data: pd.DataFrame, macro_data: pd.DataFrame) -> List[TradingSignal]:
        """Generate signals for oil, gold, and bonds"""
        signals = []
        
        if len(multi_asset_data) < 50:
            return signals
            
        latest_data = multi_asset_data.iloc[-1]
        latest_macro = macro_data.iloc[-1]
        
        assets = ['Oil', 'Gold', 'Bonds']
        
        for asset in assets:
            price = latest_data[asset]
            returns_col = f"{asset}_Returns"
            
            # Calculate short-term momentum (20-period SMA equivalent)
            if len(multi_asset_data) >= 20:
                recent_prices = multi_asset_data[asset].tail(20)
                momentum = (recent_prices.iloc[-1] / recent_prices.iloc[0] - 1) * 100
                
                # Macro filters for different assets
                macro_filter = self._get_macro_filter(asset, latest_macro)
                
                signal_strength = abs(momentum) / 10  # Normalize to 0-1 range
                signal_strength = min(signal_strength, 1.0)
                
                if momentum > 2 and macro_filter:  # 2% positive momentum
                    signals.append(TradingSignal(
                        asset=asset,
                        signal_type=SignalType.BUY,
                        strength=signal_strength,
                        price=price,
                        timestamp=latest_data['Date'].strftime('%Y-%m-%d'),
                        reason=f"Positive momentum: {momentum:.2f}%"
                    ))
                elif momentum < -2 and not macro_filter:  # 2% negative momentum
                    signals.append(TradingSignal(
                        asset=asset,
                        signal_type=SignalType.SELL,
                        strength=signal_strength,
                        price=price,
                        timestamp=latest_data['Date'].strftime('%Y-%m-%d'),
                        reason=f"Negative momentum: {momentum:.2f}%"
                    ))
        
        return signals
    
    def _get_macro_filter(self, asset: str, macro_data: pd.Series) -> bool:
        """Get macro confirmation filter for different assets"""
        if asset == "Oil":
            # Oil performs well in inflationary environments
            return macro_data['Inflation'] > 2.5
        elif asset == "Gold":
            # Gold is a safe haven in high volatility/low sentiment
            return macro_data['Sentiment'] < 0 or macro_data['Interest_Rate'] > 4.0
        elif asset == "Bonds":
            # Bonds perform well in low interest rate environments
            return macro_data['Interest_Rate'] < 3.5
        return True
    
    def calculate_position_size(self, signal: TradingSignal, portfolio_value: float, 
                               volatility: float = 0.02) -> float:
        """Calculate position size based on risk management rules"""
        # Risk 1% of portfolio per trade
        risk_amount = portfolio_value * 0.01
        
        # Adjust for volatility
        volatility_adjusted_risk = risk_amount / max(volatility, 0.005)
        
        # Adjust for signal strength
        position_size = volatility_adjusted_risk * signal.strength
        
        # Maximum 30% allocation per asset
        max_position = portfolio_value * 0.3
        
        return min(position_size, max_position)
    
    def execute_signal(self, signal: TradingSignal, portfolio_value: float) -> Dict:
        """Execute a trading signal with transaction costs and slippage"""
        execution_price = signal.price
        
        # Apply slippage
        if signal.signal_type == SignalType.BUY:
            execution_price *= (1 + self.slippage)
        else:
            execution_price *= (1 - self.slippage)
        
        position_size = self.calculate_position_size(signal, portfolio_value)
        transaction_cost = position_size * self.transaction_cost
        
        execution_record = {
            'timestamp': signal.timestamp,
            'asset': signal.asset,
            'signal_type': signal.signal_type.value,
            'price': execution_price,
            'position_size': position_size,
            'transaction_cost': transaction_cost,
            'reason': signal.reason,
            'signal_strength': signal.strength
        }
        
        return execution_record
