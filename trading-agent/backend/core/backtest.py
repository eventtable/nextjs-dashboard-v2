"""
backend/core/backtest.py
Backtest Engine — Walk-Forward-Testing auf historischen Daten.
Unterstützt alle drei Profile und Krisenperioden-Training.
"""

from dataclasses import dataclass, field
from typing import Literal
import numpy as np

from .indicators import (
    calc_all_indicators, compute_all,
    rsi as ind_rsi, macd as ind_macd, ema as ind_ema,
    bollinger_bands as ind_bb, atr as ind_atr, supertrend as ind_supertrend,
    fibonacci_levels as ind_fib, adx as ind_adx, cci as ind_cci,
    obv as ind_obv, stochastic as ind_stoch,
)
from .scoring import score_stock, Profile
from .agent import TradingAgent, _dict_to_indicator_result


@dataclass
class BacktestConfig:
    ticker: str
    profile: str
    start_date: str
    end_date: str
    initial_capital: float = 10_000.0
    commission: float = 0.001


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
    equity_curve: list = field(default_factory=list)   # [{date, value}, ...]
    trades: list = field(default_factory=list)
    metrics: dict = field(default_factory=dict)
    config: dict = field(default_factory=dict)


def run_backtest(config: BacktestConfig, agent: TradingAgent | None = None) -> BacktestResult:
    """Run a walk-forward backtest for a given config."""
    from data.fetcher import fetch_ohlcv

    df = fetch_ohlcv(config.ticker, start=config.start_date, end=config.end_date)
    if df.empty or len(df) < 60:
        return BacktestResult(
            equity_curve=[{"date": config.start_date, "value": config.initial_capital}],
            metrics={"error": "Nicht genug Daten für Backtest"},
            config=vars(config) if hasattr(config, "__dict__") else {},
        )

    return _run_backtest_on_df(df, config, agent, crisis_epoch="")


def run_crisis_backtest(
    ticker: str,
    profile: str,
    crisis_id: str,
    agent: TradingAgent | None = None,
    initial_capital: float = 10_000.0,
) -> BacktestResult:
    """Run a backtest over a specific crisis episode."""
    from data.fetcher import CRISIS_EPISODES, fetch_ohlcv

    crisis = CRISIS_EPISODES.get(crisis_id)
    if not crisis:
        return BacktestResult(
            metrics={"error": f"Unbekannte Krisenperiode: {crisis_id}"},
            config={"crisis_id": crisis_id},
        )

    df = fetch_ohlcv(ticker, start=crisis["start"], end=crisis["end"])
    if df.empty or len(df) < 20:
        return BacktestResult(
            equity_curve=[{"date": crisis["start"], "value": initial_capital}],
            metrics={"error": "Nicht genug Daten für Krisenperiode"},
            config={"crisis_id": crisis_id, "ticker": ticker},
        )

    config = BacktestConfig(
        ticker=ticker,
        profile=profile,
        start_date=crisis["start"],
        end_date=crisis["end"],
        initial_capital=initial_capital,
    )
    return _run_backtest_on_df(df, config, agent, crisis_epoch=crisis_id)


def _run_backtest_on_df(df, config: BacktestConfig, agent: TradingAgent | None,
                         crisis_epoch: str = "") -> BacktestResult:
    """Core backtest loop over a DataFrame."""
    import pandas as pd

    close  = df["close"].values.astype(float)
    high   = df["high"].values.astype(float)
    low    = df["low"].values.astype(float)
    volume = df["volume"].values.astype(float)
    dates  = [str(d)[:10] for d in df.index]
    n      = len(close)

    profile    = config.profile
    profiles   = ["momentum", "swing", "position"] if profile == "combined" else [profile]
    capital    = config.initial_capital
    commission = config.commission
    equity     = [{"date": dates[0], "value": round(capital, 2)}]
    trades     = []

    weights   = agent.get_weights() if agent else {}
    min_bars  = 60
    in_trade  = None

    # ── Precompute all indicator series once — O(n) instead of O(n²) ───────────
    def _safe(s, i, fallback):
        try:
            v = s.iloc[i]
            return fallback if pd.isna(v) else float(v)
        except Exception:
            return fallback

    rsi_s   = ind_rsi(df)
    macd_df = ind_macd(df)
    ema20_s = ind_ema(df, 20)
    ema50_s = ind_ema(df, 50)
    ema200_s = ind_ema(df, 200)
    bb_df   = ind_bb(df)
    atr_s   = ind_atr(df)
    st_df   = ind_supertrend(df)
    adx_df  = ind_adx(df)
    cci_s   = ind_cci(df)
    obv_s   = ind_obv(df)
    stoch_df = ind_stoch(df)
    fib_vals = ind_fib(df)   # single snapshot — ok for walk-forward

    def _indicators_at(i: int):
        price = float(close[i])
        obv_trend = (
            1 if obv_s.iloc[i] > obv_s.iloc[max(0, i - 5)] else -1
        )
        return {
            "price":               price,
            "rsi":                 _safe(rsi_s, i, 50.0),
            "macd":                _safe(macd_df["macd"], i, 0.0),
            "macd_signal":         _safe(macd_df["signal"], i, 0.0),
            "macd_hist":           _safe(macd_df["hist"], i, 0.0),
            "ema20":               _safe(ema20_s, i, price),
            "ema50":               _safe(ema50_s, i, price),
            "ema200":              _safe(ema200_s, i, price),
            "bb_upper":            _safe(bb_df["upper"], i, price * 1.02),
            "bb_mid":              _safe(bb_df["mid"], i, price),
            "bb_lower":            _safe(bb_df["lower"], i, price * 0.98),
            "bb_pct_b":            _safe(bb_df["pct_b"], i, 0.5),
            "bb_width":            _safe(bb_df["width"], i, 0.05),
            "atr":                 _safe(atr_s, i, price * 0.02),
            "atr_pct":             (_safe(atr_s, i, 0.0) / price * 100) if price > 0 else 2.0,
            "supertrend":          _safe(st_df["supertrend"], i, price),
            "supertrend_direction": int(_safe(st_df["direction"], i, 0)),
            "fibonacci":           {str(k): float(v) for k, v in fib_vals.items()},
            "adx":                 _safe(adx_df["adx"], i, 20.0),
            "plus_di":             _safe(adx_df["plus_di"], i, 25.0),
            "minus_di":            _safe(adx_df["minus_di"], i, 25.0),
            "cci":                 _safe(cci_s, i, 0.0),
            "obv":                 _safe(obv_s, i, 0.0),
            "obv_trend":           obv_trend,
            "stoch_k":             _safe(stoch_df["k"], i, 50.0),
            "stoch_d":             _safe(stoch_df["d"], i, 50.0),
        }

    for i in range(min_bars, n - 1):
        indicators = _indicators_at(i)
        price = close[i]
        active_profile = profiles[i % len(profiles)]
        ind = _dict_to_indicator_result(indicators, price)
        scored = score_stock(config.ticker, price, ind, active_profile, weights)

        ENTRY_THRESHOLD = 3.5
        EXIT_THRESHOLD  = 1.5
        MAX_HOLD_DAYS   = 25 if active_profile == "position" else 15

        if in_trade is None:
            if abs(scored.total_score) >= ENTRY_THRESHOLD:
                in_trade = {
                    "direction":   "long" if scored.total_score > 0 else "short",
                    "entry_price": price,
                    "entry_date":  dates[i],
                    "entry_idx":   i,
                    "profile":     active_profile,
                    "score":       scored.total_score,
                }
        else:
            hold   = i - in_trade["entry_idx"]
            flip   = in_trade["direction"] == "long"  and scored.total_score < -EXIT_THRESHOLD
            flip_s = in_trade["direction"] == "short" and scored.total_score >  EXIT_THRESHOLD
            should_exit = hold >= MAX_HOLD_DAYS or flip or flip_s or abs(scored.total_score) < EXIT_THRESHOLD

            if should_exit:
                ep  = price
                d   = in_trade["direction"]
                pnl = ((ep - in_trade["entry_price"]) / in_trade["entry_price"]
                       if d == "long"
                       else (in_trade["entry_price"] - ep) / in_trade["entry_price"])
                pnl -= commission  # subtract commission

                position_size = capital * 0.05
                capital += position_size * pnl

                bt = BacktestTrade(
                    ticker=config.ticker,
                    entry_date=in_trade["entry_date"],
                    exit_date=dates[i],
                    direction=d,
                    entry_price=round(in_trade["entry_price"], 4),
                    exit_price=round(ep, 4),
                    pnl_pct=round(pnl * 100, 3),
                    profit=pnl > 0,
                    signal_score=in_trade["score"],
                    hold_days=hold,
                    profile=in_trade["profile"],
                    crisis_epoch=crisis_epoch,
                )
                trades.append(bt)
                equity.append({"date": dates[i], "value": round(capital, 2)})

                if agent:
                    agent.record_trade(
                        ticker=config.ticker, direction=d,
                        entry=in_trade["entry_price"], exit_price=ep,
                        profile=in_trade["profile"], crisis_epoch=crisis_epoch,
                    )
                    weights = agent.get_weights()

                in_trade = None

    # Compute metrics
    wins   = [t for t in trades if t.profit]
    losses = [t for t in trades if not t.profit]
    pnls   = [t.pnl_pct / 100 for t in trades]

    win_rate     = len(wins) / len(trades) * 100 if trades else 0.0
    total_return = (capital - config.initial_capital) / config.initial_capital * 100
    avg_win      = float(np.mean([t.pnl_pct for t in wins]))  if wins   else 0.0
    avg_loss     = float(np.mean([t.pnl_pct for t in losses])) if losses else 0.0
    rr           = abs(avg_win / avg_loss) if avg_loss != 0 else 0.0

    vals  = [e["value"] for e in equity]
    peak, max_dd = vals[0], 0.0
    for v in vals:
        if v > peak:
            peak = v
        dd = (peak - v) / peak
        if dd > max_dd:
            max_dd = dd

    sharpe = 0.0
    if len(pnls) > 2:
        std_r = float(np.std(pnls))
        sharpe = float(np.mean(pnls)) / std_r * (252 ** 0.5) if std_r > 0 else 0.0

    metrics = {
        "total_return_pct": round(total_return, 2),
        "final_capital":    round(capital, 2),
        "initial_capital":  config.initial_capital,
        "win_rate":         round(win_rate, 2),
        "total_trades":     len(trades),
        "wins":             len(wins),
        "losses":           len(losses),
        "avg_win_pct":      round(avg_win, 3),
        "avg_loss_pct":     round(avg_loss, 3),
        "risk_reward":      round(rr, 2),
        "max_drawdown_pct": round(max_dd * 100, 2),
        "sharpe_approx":    round(sharpe, 3),
        "weights_final":    agent.get_weights() if agent else {},
    }

    return BacktestResult(
        equity_curve=equity[-300:],
        trades=[vars(t) for t in trades[-50:]],
        metrics=metrics,
        config={
            "ticker":          config.ticker,
            "profile":         config.profile,
            "start_date":      config.start_date,
            "end_date":        config.end_date,
            "initial_capital": config.initial_capital,
            "crisis_epoch":    crisis_epoch,
        },
    )
