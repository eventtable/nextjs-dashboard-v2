"""
backend/core/agent.py
Selbstlernender Trading-Agent.
— Paper-Trading Loop
— Reinforcement Learning auf Indikator-Gewichten
— Persistente State-Speicherung
"""

import json
import os
import time
import uuid
from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import Literal

# Allow override via env var so Railway volumes can be used:
# Set AGENT_STATE_FILE=/data/agent_state.json in Railway and mount a volume at /data
STATE_FILE_DEFAULT = os.environ.get(
    "AGENT_STATE_FILE",
    os.path.join(os.path.dirname(__file__), "..", "agent_state.json"),
)

Profile = Literal["momentum", "swing", "position"]

DEFAULT_WEIGHTS = {
    "rsi":        0.20,
    "macd":       0.15,
    "ema":        0.20,
    "supertrend": 0.15,
    "fib":        0.12,
    "volume":     0.10,
    "bb":         0.08,
}

PROFILE_WEIGHTS: dict[str, dict] = {
    "momentum": {"rsi": 0.30, "macd": 0.25, "volume": 0.20, "bb": 0.10, "ema": 0.08, "supertrend": 0.05, "fib": 0.02},
    "swing":    {"ema": 0.25, "fib": 0.22, "supertrend": 0.20, "rsi": 0.15, "macd": 0.10, "bb": 0.05, "volume": 0.03},
    "position": {"ema": 0.30, "supertrend": 0.25, "fib": 0.18, "macd": 0.12, "rsi": 0.08, "volume": 0.05, "bb": 0.02},
}


@dataclass
class Prediction:
    id: str
    ticker: str
    profile: str
    score: float
    signal: str
    confidence: float
    timestamp: str
    indicators: dict = field(default_factory=dict)
    outcome: float | None = None   # set after record_outcome()


@dataclass
class PaperTrade:
    id: str
    ticker: str
    action: str       # buy | sell
    shares: float
    price: float
    profile: str
    timestamp: str
    is_open: bool = True
    exit_price: float = 0.0
    pnl_pct: float = 0.0


@dataclass
class Trade:
    id: str
    ticker: str
    direction: str      # long | short
    entry_price: float
    exit_price: float
    pnl_pct: float
    profit: bool
    profile: Profile
    strategy_used: str
    timestamp: float
    crisis_epoch: str = ""


@dataclass
class AgentState:
    capital: float = 100_000.0
    weights: dict = field(default_factory=lambda: dict(DEFAULT_WEIGHTS))
    profile_weights: dict = field(default_factory=lambda: {k: dict(v) for k, v in PROFILE_WEIGHTS.items()})
    trades: list = field(default_factory=list)
    predictions: list = field(default_factory=list)
    paper_trades: list = field(default_factory=list)
    win_history: list = field(default_factory=list)
    total_pnl: float = 0.0
    learning_rate: float = 0.015
    version: int = 1
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TradingAgent:
    def __init__(self, state_file: str | None = None):
        self._state_file = state_file or STATE_FILE_DEFAULT
        os.makedirs(os.path.dirname(self._state_file), exist_ok=True)
        self.state = self._load_state()

    def _load_state(self) -> AgentState:
        if os.path.exists(self._state_file):
            try:
                data = json.loads(open(self._state_file).read())
                s = AgentState()
                s.__dict__.update(data)
                return s
            except Exception:
                pass
        return AgentState()

    def save_state(self):
        self.state.updated_at = datetime.now(timezone.utc).isoformat()
        with open(self._state_file, "w") as f:
            f.write(json.dumps(asdict(self.state), indent=2))

    def reset(self):
        self.state = AgentState()
        self.save_state()

    # ── Prediction API ────────────────────────────────────────────────────────

    def predict(self, ticker: str, indicators: dict, profile: str) -> Prediction:
        """Score a ticker and return a Prediction, stored in state."""
        from .scoring import score_stock
        from .indicators import IndicatorResult

        price = indicators.get("price", 0.0)
        ind = _dict_to_indicator_result(indicators, price)
        scored = score_stock(ticker, price, ind, profile, self.state.weights)

        raw_conf = min(abs(scored.total_score) / 10.0, 1.0)
        pred = Prediction(
            id=str(uuid.uuid4()),
            ticker=ticker,
            profile=profile,
            score=round(scored.total_score, 3),
            signal=scored.signal,
            confidence=round(raw_conf, 3),
            timestamp=datetime.now(timezone.utc).isoformat(),
            indicators=indicators,
        )
        self.state.predictions.append(asdict(pred))
        if len(self.state.predictions) > 500:
            self.state.predictions = self.state.predictions[-500:]
        self.save_state()
        return pred

    def record_outcome(self, prediction_id: str, actual_return_pct: float) -> bool:
        """Find a stored prediction by ID and learn from its outcome."""
        for p in self.state.predictions:
            if p["id"] == prediction_id:
                p["outcome"] = actual_return_pct
                direction = "long" if p["signal"] in ("long", "STRONG_BUY", "BUY") else "short"
                entry = 100.0
                exit_price = entry * (1 + actual_return_pct / 100)
                self.record_trade(
                    ticker=p["ticker"],
                    direction=direction,
                    entry=entry,
                    exit_price=exit_price,
                    profile=p["profile"],
                )
                self.save_state()
                return True
        return False

    # ── Paper-Trading API ─────────────────────────────────────────────────────

    def paper_trade(self, ticker: str, action: str, shares: float,
                    price: float, profile: str = "momentum") -> PaperTrade:
        """Open a paper trade position."""
        trade = PaperTrade(
            id=str(uuid.uuid4()),
            ticker=ticker,
            action=action,
            shares=shares,
            price=price,
            profile=profile,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
        self.state.paper_trades.append(asdict(trade))
        if len(self.state.paper_trades) > 200:
            self.state.paper_trades = self.state.paper_trades[-200:]
        self.save_state()
        return trade

    def close_trade(self, trade_id: str, exit_price: float) -> dict | None:
        """Close an open paper trade and learn from it."""
        for t in self.state.paper_trades:
            if t["id"] == trade_id and t.get("is_open", True):
                entry = t["price"]
                direction = "long" if t["action"] == "buy" else "short"
                pnl = ((exit_price - entry) / entry if direction == "long"
                       else (entry - exit_price) / entry)

                t["is_open"] = False
                t["exit_price"] = exit_price
                t["pnl_pct"] = round(pnl * 100, 3)

                self.record_trade(
                    ticker=t["ticker"],
                    direction=direction,
                    entry=entry,
                    exit_price=exit_price,
                    profile=t["profile"],
                )
                self.save_state()
                return t
        return None

    # ── Core learning ─────────────────────────────────────────────────────────

    def record_trade(
        self,
        ticker: str,
        direction: str,
        entry: float,
        exit_price: float,
        profile: Profile = "momentum",
        crisis_epoch: str = "",
    ) -> Trade:
        pnl_pct = (
            (exit_price - entry) / entry
            if direction == "long"
            else (entry - exit_price) / entry
        )
        profit = pnl_pct > 0
        trade = Trade(
            id=f"{ticker}_{int(time.time()*1000)}",
            ticker=ticker,
            direction=direction,
            entry_price=round(entry, 4),
            exit_price=round(exit_price, 4),
            pnl_pct=round(pnl_pct, 6),
            profit=profit,
            profile=profile,
            strategy_used=f"{profile}_v{self.state.version}",
            timestamp=time.time(),
            crisis_epoch=crisis_epoch,
        )
        self.state.trades.append(asdict(trade))
        self.state.total_pnl += pnl_pct * 1000
        self.state.capital += pnl_pct * 1000

        self._learn_from_trade(trade)
        self._update_win_history()
        return trade

    def _learn_from_trade(self, trade: Trade):
        lr = self.state.learning_rate
        w = self.state.weights
        profile = trade.profile

        if trade.profit:
            if profile == "momentum":
                w["rsi"]    = min(0.5, w["rsi"]    + lr)
                w["macd"]   = min(0.4, w["macd"]   + lr * 0.8)
                w["volume"] = min(0.3, w["volume"]  + lr * 0.5)
            elif profile == "swing":
                w["ema"]        = min(0.5, w["ema"]        + lr)
                w["fib"]        = min(0.4, w["fib"]        + lr * 0.8)
                w["supertrend"] = min(0.4, w["supertrend"] + lr * 0.6)
            else:
                w["ema"]        = min(0.55, w["ema"]        + lr * 1.2)
                w["supertrend"] = min(0.4,  w["supertrend"] + lr * 0.8)
        else:
            sorted_keys = sorted(w.keys(), key=lambda k: w[k])
            weakest = sorted_keys[0]
            w[weakest] = max(0.01, w[weakest] - lr)
            w[sorted_keys[-1]] = min(0.55, w[sorted_keys[-1]] + lr * 0.3)

        self._normalize_weights()
        self.state.profile_weights[profile] = dict(self.state.weights)

    def _normalize_weights(self):
        w = self.state.weights
        total = sum(w.values())
        if total > 0:
            for k in w:
                w[k] = round(w[k] / total, 4)

    def _update_win_history(self):
        last = self.state.trades[-20:]
        wins = sum(1 for t in last if t.get("profit"))
        wr = wins / len(last) * 100 if last else 0
        self.state.win_history.append(round(wr, 1))
        if len(self.state.win_history) > 500:
            self.state.win_history = self.state.win_history[-500:]

    # ── Stats ─────────────────────────────────────────────────────────────────

    def get_stats(self) -> dict:
        return self.stats

    @property
    def stats(self) -> dict:
        t = self.state.trades
        if not t:
            return {"total": 0, "wins": 0, "losses": 0, "win_rate": 0.0,
                    "avg_win": 0.0, "avg_loss": 0.0, "best": 0.0, "worst": 0.0,
                    "total_pnl": 0.0, "capital": self.state.capital}
        wins   = [x for x in t if x.get("profit")]
        losses = [x for x in t if not x.get("profit")]
        pnls   = [x["pnl_pct"] * 100 for x in t]
        return {
            "total":    len(t),
            "wins":     len(wins),
            "losses":   len(losses),
            "win_rate": round(len(wins) / len(t) * 100, 2),
            "avg_win":  round(sum(x["pnl_pct"] for x in wins)  / max(len(wins), 1) * 100, 3),
            "avg_loss": round(sum(x["pnl_pct"] for x in losses) / max(len(losses), 1) * 100, 3),
            "best":     round(max(pnls), 3),
            "worst":    round(min(pnls), 3),
            "total_pnl": round(self.state.total_pnl, 2),
            "capital":  round(self.state.capital, 2),
            "profile_breakdown": self._profile_stats(t),
        }

    def _profile_stats(self, trades) -> dict:
        result = {}
        for profile in ("momentum", "swing", "position"):
            pt = [t for t in trades if t.get("profile") == profile]
            if not pt:
                continue
            wins = sum(1 for t in pt if t.get("profit"))
            result[profile] = {"trades": len(pt), "win_rate": round(wins / len(pt) * 100, 1)}
        return result

    def get_weights(self) -> dict:
        return dict(self.state.weights)

    def get_win_history(self) -> list:
        return list(self.state.win_history)

    def get_recent_trades(self, n: int = 20) -> list:
        return self.state.trades[-n:][::-1]


def _dict_to_indicator_result(d: dict, price: float):
    """Convert a compute_all() dict to an IndicatorResult for scoring."""
    from .indicators import IndicatorResult
    import numpy as np

    # Nearest Fibonacci level
    fib_data = d.get("fibonacci", {})
    fib_levels_pct = [0.0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0]
    fib_prices = {float(k): float(v) for k, v in fib_data.items()} if fib_data else {}
    if fib_prices and price > 0:
        nearest_lvl = min(fib_prices, key=lambda k: abs(fib_prices[k] - price))
        fib_dist = abs(fib_prices[nearest_lvl] - price) / price
    else:
        nearest_lvl = 0.5
        fib_dist = 0.05

    return IndicatorResult(
        price          = price,
        rsi            = d.get("rsi", 50.0),
        macd           = d.get("macd", 0.0),
        macd_hist      = d.get("macd_hist", 0.0),
        volume_ratio   = d.get("volume_ratio", 1.0),
        bb_pct         = d.get("bb_pct_b", 0.5),
        dist_52h       = d.get("dist_52h", 0.1),
        dist_52l       = d.get("dist_52l", 0.1),
        stoch_k        = d.get("stoch_k", 50.0),
        ema9           = d.get("ema9", d.get("ema20", price)),
        ema21          = d.get("ema21", d.get("ema20", price)),
        ema50          = d.get("ema50", price),
        ema200         = d.get("ema200", price),
        supertrend_above = d.get("supertrend_direction", 1) >= 0,
        fib_dist       = round(fib_dist, 4),
        fib_level      = nearest_lvl,
        cci            = d.get("cci", 0.0),
        adx            = d.get("adx", 20.0),
        atr            = d.get("atr", price * 0.01),
    )


_agent: TradingAgent | None = None


def get_agent() -> TradingAgent:
    global _agent
    if _agent is None:
        _agent = TradingAgent()
    return _agent
