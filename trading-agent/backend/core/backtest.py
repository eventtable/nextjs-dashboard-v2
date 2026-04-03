"""
backend/core/backtest.py
Backtest Engine — Walk-Forward-Testing auf historischen Daten.
Unterstützt alle drei Profile und Krisenperioden-Training.
"""

from dataclasses import dataclass, field
from typing import Literal
import numpy as np

from .indicators import calc_all_indicators
from .scoring import score_stock, Profile
from .agent import TradingAgent


@dataclass
class BacktestTrade:
    ticker: str
    entry_date: str
    exit_date: str
    direction: str
    entry_price: float
    exit_price: float
    pnl_pct: float
    profit: bool
    signal_score: float
    hold_days: int
    profile: str
    crisis_epoch: str = ""


@dataclass
class BacktestResult:
    ticker: str
    profile: Profile
    start_date: str
    end_date: str
    initial_capital: float
    final_capital: float
    total_return_pct: float
    win_rate: float
    total_trades: int
    wins: int
    losses: int
    max_drawdown: float
    avg_win_pct: float
    avg_loss_pct: float
    risk_reward: float
    sharpe_approx: float
    trades: list = field(default_factory=list)
    equity_curve: list = field(default_factory=list)
    weights_final: dict = field(default_factory=dict)


def run_backtest(
    ticker,
    ohlcv,
    profile: Profile = "momentum",
    initial_capital: float = 100_000.0,
    agent: TradingAgent | None = None,
    crisis_epoch: str = "",
    learn: bool = True,
) -> BacktestResult:
    close  = ohlcv.close
    high   = ohlcv.high
    low    = ohlcv.low
    volume = ohlcv.volume
    dates  = ohlcv.dates
    n      = len(close)

    profiles = ["momentum", "swing", "position"] if profile == "combined" else [profile]
    capital  = initial_capital
    equity   = [capital]
    trades = []

    weights = agent.get_weights() if agent else {}
    min_bars = 60
    in_trade = None

    for i in range(min_bars, n - 1):
        ind = calc_all_indicators(close[:i+1], high[:i+1], low[:i+1], volume[:i+1])
        active_profile = profiles[i % len(profiles)]
        scored = score_stock(ticker, close[i], ind, active_profile, weights)

        ENTRY_THRESHOLD = 3.5
        EXIT_THRESHOLD  = 1.5
        MAX_HOLD_DAYS   = 25 if active_profile == "position" else 15

        if in_trade is None:
            if abs(scored.total_score) >= ENTRY_THRESHOLD:
                in_trade = {
                    "direction":   "long" if scored.total_score > 0 else "short",
                    "entry_price": close[i],
                    "entry_date":  dates[i],
                    "entry_idx":   i,
                    "profile":     active_profile,
                    "score":       scored.total_score,
                }
        else:
            hold = i - in_trade["entry_idx"]
            flip   = in_trade["direction"] == "long"  and scored.total_score < -EXIT_THRESHOLD
            flip_s = in_trade["direction"] == "short" and scored.total_score >  EXIT_THRESHOLD
            should_exit = hold >= MAX_HOLD_DAYS or flip or flip_s or abs(scored.total_score) < EXIT_THRESHOLD

            if should_exit:
                ep  = close[i]
                d   = in_trade["direction"]
                pnl = ((ep - in_trade["entry_price"]) / in_trade["entry_price"]
                       if d == "long"
                       else (in_trade["entry_price"] - ep) / in_trade["entry_price"])
                capital += capital * 0.10 * pnl

                bt = BacktestTrade(
                    ticker=ticker, entry_date=in_trade["entry_date"], exit_date=dates[i],
                    direction=d, entry_price=round(in_trade["entry_price"], 4),
                    exit_price=round(ep, 4), pnl_pct=round(pnl * 100, 3),
                    profit=pnl > 0, signal_score=in_trade["score"],
                    hold_days=hold, profile=in_trade["profile"], crisis_epoch=crisis_epoch,
                )
                trades.append(bt)

                if learn and agent:
                    agent.record_trade(
                        ticker=ticker, direction=d,
                        entry=in_trade["entry_price"], exit_price=ep,
                        profile=in_trade["profile"], crisis_epoch=crisis_epoch,
                    )
                    weights = agent.get_weights()

                in_trade = None
                equity.append(capital)

    wins   = [t for t in trades if t.profit]
    losses = [t for t in trades if not t.profit]
    pnls   = [t.pnl_pct / 100 for t in trades]

    win_rate     = len(wins) / len(trades) * 100 if trades else 0
    total_return = (capital - initial_capital) / initial_capital * 100
    avg_win      = np.mean([t.pnl_pct for t in wins])  if wins   else 0.0
    avg_loss     = np.mean([t.pnl_pct for t in losses]) if losses else 0.0
    rr           = abs(avg_win / avg_loss) if avg_loss != 0 else 0.0

    peak, max_dd = equity[0], 0.0
    for e in equity:
        if e > peak: peak = e
        dd = (peak - e) / peak
        if dd > max_dd: max_dd = dd

    sharpe = 0.0
    if len(pnls) > 2:
        std_r = float(np.std(pnls))
        sharpe = float(np.mean(pnls)) / std_r * (252 ** 0.5) if std_r > 0 else 0.0

    return BacktestResult(
        ticker=ticker, profile=profile,
        start_date=dates[min_bars] if dates else "",
        end_date=dates[-1] if dates else "",
        initial_capital=initial_capital,
        final_capital=round(capital, 2),
        total_return_pct=round(total_return, 2),
        win_rate=round(win_rate, 2),
        total_trades=len(trades),
        wins=len(wins), losses=len(losses),
        max_drawdown=round(max_dd * 100, 2),
        avg_win_pct=round(float(avg_win), 3),
        avg_loss_pct=round(float(avg_loss), 3),
        risk_reward=round(rr, 2),
        sharpe_approx=round(sharpe, 3),
        trades=[vars(t) for t in trades[-50:]],
        equity_curve=equity[-300:],
        weights_final=agent.get_weights() if agent else {},
    )
